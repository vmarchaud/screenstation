import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../../shared/types/packets'
import { decodeIO } from '../../../../shared/utils/decode'
import { promises, existsSync } from 'fs'
import * as path from 'path'
import {
  CastViewPayloadIO,
  StopCastViewPayloadIO,
  ListSinkPayloadIO
} from './io-types'
import { encodeIO } from '../../../../shared/utils/encode'
import of from '../../../../shared/utils/of'
import MDNS from 'multicast-dns'

const CastPluginConfigIO = t.type({
  sinkUsed: t.array(t.array(t.string)),
  checkCastInterval: t.number
})

export type CastPluginConfig = t.TypeOf<typeof CastPluginConfigIO>

enum PayloadType {
  LIST_SINKS = 'LIST_SINKS',
  SELECT_SINK = 'SELECT_SINK',
  STOP_SINK = 'STOP_SINK'
}

type MdnsResponse = {
  id: number,
  type: 'response',
  flags: number,
  opcode: string,
  questions: [],
  answers: Array<{
    name: string,
    type: string,
    ttl: number,
    class: string,
    flush: boolean
    data: string
  }>,
  authories: [],
  additionals: Array<{
    name: string,
    type: string
    ttl: number
    flush: boolean
    data: Buffer[] | { priority: number, weight: number, port: number, target: string } | string
  }>
}

type ChromecastState = {
  rm?: string
  /**
   * Chromecast id
   */
  id: string
  cd: string
  ve: string
  md: string
  ic: string
  /**
   * chromecast name
   */
  fn: string
  /**
   * Chromecast message
   */
  rs: string
  /**
   * Is casting ?
   */
  st: '0' | '1'
  nf: '0' | '1'
}

export class CastPlugin implements Plugin {

  static readonly metadata: PluginMetadata = {
    id: 'core/cast',
    version: '0.1.0',
    displayName: 'Cast view to chromecast',
    installedAt: new Date()
  }

  // @ts-ignore
  private config: CastPluginConfig
  private store: WorkerStore
  private castsAvailable: ChromecastState[] = []
  private currentCastsUsed: Map<string, ChromecastState> = new Map()
  private mdns = MDNS()

  async init (store: WorkerStore) {
    this.store = store
    const configPath = path.resolve(this.store.configRootPath, './cast.json')
    if (existsSync(configPath) === false) {
      this.config = { sinkUsed: [], checkCastInterval: 10000 }
    } else {
      const rawConfig = await promises.readFile(configPath)
      this.config = await decodeIO(CastPluginConfigIO, JSON.parse(rawConfig.toString()))
    }
    // save config every 5min in case we abrubtly shutdown
    setInterval(() => {
      void of(this.saveConfig())
    }, 1000 * 60 * 5)
    await this.updateAvailableChromecast()
    setInterval(this.updateAvailableChromecast.bind(this), this.config.checkCastInterval)
  }

  async destroy () {
    await this.saveConfig()
  }

  async getPacketTypes () {
    return Object.values(PayloadType).map(type => ({ type }))
  }

  async getMetadata () {
    return CastPlugin.metadata
  }

  async handle (packet: Packet) {
    const { views } = this.store
    switch (packet.type) {
      case PayloadType.LIST_SINKS: {
        // @ts-ignore
        const payload = await decodeIO(ListSinkPayloadIO, packet.payload)
        packet.payload = {
          sinks: this.castsAvailable.concat(Array.from(this.currentCastsUsed.values())).map(cast => ({
            id: cast.id,
            name: cast.fn,
            type: 'CHROMECAST'
          })),
          currentlyUsed: Array.from(this.currentCastsUsed.entries()).map(([viewId, cast]) => ([viewId, cast.id]))
        }
        break
      }
      case PayloadType.SELECT_SINK: {
        const payload = await decodeIO(CastViewPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        const cast = this.castsAvailable.find(cast => cast.fn === payload.sink)
        if (cast === undefined) {
          packet.error = `Failed to find sink with id ${payload.sink}`
          break
        }
        await view.page.bringToFront()
        await view.session.send('Cast.setSinkToUse', { sinkName: cast.fn })
        await view.session.send('Cast.startTabMirroring', { sinkName: cast.fn })
        this.currentCastsUsed.set(view.id, cast)
        void this.saveConfig()
        // restore current selected view
        const selectedView = this.store.views.find(view => view.isSelected)
        if (selectedView) await selectedView.page.bringToFront()
        break
      }
      case PayloadType.STOP_SINK: {
        const payload = await decodeIO(StopCastViewPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        const currentSink = this.currentCastsUsed.get(payload.view)
        if (currentSink === undefined) break
        await view.session.send('Cast.stopCasting', { sinkName: currentSink.fn })
        this.currentCastsUsed.delete(payload.view)
        void this.saveConfig()
        break
      }
    }
    return packet
  }

  private async castView (cast: ChromecastState, viewId: string, force: boolean = false) {
    const view = this.store.views.find(view => view.id === viewId)
    const castName = cast.fn
    if (view === undefined) return
    if (this.currentCastsUsed.has(view.id) && force === false) return
    this.currentCastsUsed.set(view.id, cast)
    await view.page.bringToFront()
    await view.page.waitForSelector('body')
    await view.session.send('Cast.setSinkToUse', { sinkName: castName })
    await view.page.waitFor(5000)
    await view.session.send('Cast.startTabMirroring', { sinkName: castName })
    // restore current selected view
    const selectedView = this.store.views.find(view => view.isSelected)
    if (selectedView) await selectedView.page.bringToFront()
  }

  private async saveConfig () {
    const configPath = path.resolve(this.store.configRootPath, './cast.json')
    this.config.sinkUsed = Array.from(this.currentCastsUsed.entries()).map(([ viewId, cast ]) => {
      return [ viewId, cast.id ]
    })
    const serializedConfig = await encodeIO(CastPluginConfigIO, this.config)
    const rawConfig = JSON.stringify(serializedConfig)
    await promises.writeFile(configPath, rawConfig)
  }

  private async getChromecasts (): Promise<ChromecastState[]> {
    return new Promise((resolve, reject) => {
      const chromecasts: ChromecastState[] = []
      const onMdnsResponse = (response: MdnsResponse) => {
        // get TEXT responses
        const result = response.additionals.filter(add => add.type === 'TXT').map(txtResponse => {
          const buffers = txtResponse.data as Buffer[]
          // construct chromecast metadata from TXT response
          const metadata = buffers.reduce((metadata, buff) => {
            const line = buff.toString()
            const [ key, value ] = line.trim().split('=')
            metadata[key] = value
            return metadata
          }, {} as ChromecastState)
          return metadata
        })
        chromecasts.push(...result)
      }
      this.mdns.on('response', onMdnsResponse)
      this.mdns.query('_googlecast._tcp.local', 'PTR')
      // wait 1s for all chromecasts responses
      setTimeout(() => {
        this.mdns.removeListener('response', onMdnsResponse)
        return resolve(chromecasts)
      }, 1000)
    })
  }

  private async updateAvailableChromecast (): Promise<void> {
    const casts = await this.getChromecasts()
    let castsAvailable = casts.filter(cast => cast.st === '0')
    for (const [ viewId, castId ] of this.config.sinkUsed) {
      const cast = castsAvailable.find(cast => cast.id === castId)
      // we see the cast available even though we should cast to it from the config
      // so lets recast
      if (cast !== undefined) {
        await this.castView(cast, viewId, true)
        console.log(`Restoring cast from view ${viewId} on ${cast.fn}`)
        castsAvailable = castsAvailable.filter(_cast => _cast.id !== cast.id)
      }
    }
    for (const [ viewId, castState ] of this.currentCastsUsed) {
      const cast = castsAvailable.find(cast => cast.id === castState.id)
      // we see the cast available even though we should be casting to it
      // someone might have disconnected our cast, lets recast
      if (cast !== undefined) {
        await this.castView(cast, viewId, true)
        console.log(`Recasting view ${viewId} on ${cast.fn} cause someone uncast`)
        castsAvailable = castsAvailable.filter(_cast => _cast.id !== cast.id)
      }
    }
    this.castsAvailable = castsAvailable
  }
}

export default new CastPlugin()