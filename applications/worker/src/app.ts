import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import './puppeteer-plugins'
import config from './config'
import { decodeIO } from '../../shared/utils/decode'
import { PacketIO, Packet } from '../../shared/types/packets'
import { WebsocketTransport } from '../../shared/utils/ws'
import of from '../../shared/utils/of'
import MDNS from 'multicast-dns'
import { WorkerStore, PluginToLoad, Plugin } from './types'
import { promises } from 'fs'
import * as path from 'path'

import * as CorePlugins from './plugins'

process.env.GOOGLE_API_KEY = 'no'
process.env.GOOGLE_DEFAULT_CLIENT_ID = 'no'
process.env.GOOGLE_DEFAUqLT_CLIENT_SECRET = 'no'

export class Worker {

  private store: WorkerStore

  private corePlugins: Plugin[] = Object.values(CorePlugins)

  private pluginsToLoad: PluginToLoad[] = []
  private packetHandlers: Map<string, Plugin> = new Map()

  private shuttingDown: boolean = false
  
  async init () {
    console.log('Waiting to discover master on network using mdns')
    const masterAddress = await this.discoverMaster()
    console.log(`Disovered master available at ${masterAddress}, connecting ..`)
    const ws = new WebsocketTransport(masterAddress)
    await ws.connect()
    console.log('Connected to master')
    console.log('Starting handshake ...')
    await this.handshake(ws)
    console.log('Handshake done')
    console.log('Verifying configuration folder')
    const configRootPath = path.resolve(process.env.STATION_CONFIG_PATH || '/etc/screenstation/')
    await of(promises.mkdir(configRootPath))
    this.store = {
      browser: await this.getBrowser(),
      views: [],
      socket: ws,
      workerName: config.NAME,
      plugins: [],
      configRootPath
    }
    console.log('Loading plugins ...')
    for (let plugin of this.corePlugins) {
      const meta = await plugin.getMetadata()
      const packets = await plugin.getPacketTypes()
      console.log(`Found plugin ${meta.id} (${meta.version}), enabling ..`)
      await plugin.init(this.store)
      console.log(`Registering packet ${packets.map(pkt => pkt.type).join(',')} for plugin ${meta.id}`)
      for (let packet of packets) {
        this.packetHandlers.set(packet.type, plugin)
      }
      console.log(`Plugin ${meta.id} has been enabled`)
      this.store.plugins.push(plugin)
    }
    console.log('Loading plugins ...')
    for (let pluginToLoad of this.pluginsToLoad) {
      const exported = require(pluginToLoad.path)
      const plugin = exported.default as Plugin
      const meta = await plugin.getMetadata()
      const packets = await plugin.getPacketTypes()
      console.log(`Found plugin ${meta.id} (${meta.version}) at ${pluginToLoad.path}, enabling ..`)
      await plugin.init(this.store)
      console.log(`Registering packet ${packets.map(pkt => pkt.type).join(',')} for plugin ${meta.id}`)
      for (let packet of packets) {
        this.packetHandlers.set(packet.type, plugin)
      }
      console.log(`Plugin ${meta.id} has been enabled`)
      this.store.plugins.push(plugin)
    }
    console.log(`Listening for new packets`)
    ws.on('message', async (data) => {
      const [ packet, err ] = await of(decodeIO(PacketIO, JSON.parse(data)))
      if (packet === undefined) return
      if (err) {
        packet.error = err.message || `Failed to decode`
        packet.ack = true
        return ws.send(packet)
      }
      const plugin = this.packetHandlers.get(packet.type)
      if (plugin === undefined) {
        console.warn(`Received packet with type ${packet.type} but found no plugin to handle it`)
        packet.error = `No plugin found to handle this kind of packet`
        packet.ack = true
        return ws.send(packet)
      }
      console.log(`Received packet ${packet.type} (seq:${packet.sequence})`)
      const packetToReturn = await plugin.handle(packet)
      console.log(`Packet ${packet.type} processed (seq:${packet.sequence})`)
      packet.ack = true
      packet.sent = new Date()
      return ws.send(packetToReturn)
    })
    this.store.browser.on('disconnected', async (err) => {
      console.log(`Chrome instance was disconnected, re-launching ...`)
      for (let plugin of this.store.plugins) {
        const meta = await plugin.getMetadata()
        await of(plugin.destroy())
        console.log(`Plugin ${meta.displayName} has been destroyed`)
      }
      await this.init()
    })
    console.log('Listening for shutdown request ...')
    process.on('SIGINT', this.onShutdown.bind(this))
    process.on('SIGINT', this.onShutdown.bind(this))
    process.on('SIGQUIT', this.onShutdown.bind(this))
  }

  private async handshake (socket: WebsocketTransport) {
    return Promise.race([
      new Promise((_, reject) => {
        return setTimeout(() => reject(new Error(`Timeout while waiting for handshake`)), 5000)
      }),
      new Promise((resolve, reject) => {
        const helloPacket: Packet = {
          type: 'HELLO',
          sent: new Date(),
          sequence: 1,
          payload: {
            name: config.NAME,
            version: config.VERSION
          },
          error: undefined,
          ack: undefined
        }
        socket.once('message', (data) => {
          const packet = JSON.parse(data)
          if (packet.type !== 'HELLO') {
            return reject(new Error(`Excepted handshake and received ${packet.type}`))
          }
          socket.on('reconnected', function () {
            socket.send(helloPacket)
          })
          return resolve()
        })
        socket.once('error', reject)
        socket.send(helloPacket)
      })
    ])
  }

  private async getBrowser () {
    puppeteer.use(StealthPlugin({
      enabledEvasions: StealthPlugin().availableEvasions
    }))
    // we want to avoid popup to restore session so we override the state of chrome
    const browser = await puppeteer.launch({
      headless: false,
      ignoreDefaultArgs: true,
      executablePath: "/usr/bin/google-chrome",
      args: [
        '--start-fullscreen',
        `--window-position=${config.LAUNCH_POSITION}`,
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--disable-background-timer-throttling',
        '--disable-permissions-api',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-session-crashed-bubble',
        '--disable-sync',
        '--disable-infobars',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--kiosk',
        '--password-store=basic',
        '--use-mock-keychain',
        '--hide-scrollbars',
        '--mute-audio',
      ]
    })
    return browser
  }

  private discoverMaster (): Promise<string> {
    return new Promise((resolve, reject) => {
      const mdns = MDNS()
      mdns.on('response', (response) => {
        const srv = response.answers[0]
        mdns.destroy()
        return resolve(`ws://${srv.data.target}:${srv.data.port}`)
      })
      mdns.query('workers.screenstation.local', 'SRV')
    })
  }

  private async onShutdown (signal: NodeJS.Signals) {
    if (this.shuttingDown === true) return console.log(`Received ${signal} signal but already shutting down`)
    this.shuttingDown = true
    console.log(`Received signal ${signal}, start shutdown procedure`)
    for (let plugin of this.store.plugins) {
      const meta = await plugin.getMetadata()
      await plugin.destroy()
      console.log(`Plugin ${meta.displayName} has been destroyed`)
    }
    console.log(`Cleaning up resources`)
    await of(this.store.browser.close())
    console.log('Shutting down succesfull')
  }
}


new Worker().init().then(_ => {
  console.log(`Worker is ready`)
}).catch(err => {
  console.error(`Failed to start`, err)
  return process.exit(1)
})