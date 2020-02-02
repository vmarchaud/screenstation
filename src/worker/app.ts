
import customEnv from 'custom-env'
customEnv.env(process.env.NODE_ENV)

import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import config from './config'
import { decodeIO } from '../shared/utils/decode'
import { PacketIO, PayloadType, ShowPayloadIO, Packet, CreateViewPayloadIO, CastViewPayloadIO } from '../shared/types/packets'
import { WebsocketTransport } from '../shared/utils/ws'
import { Sink } from '../shared/types/sink'
import { View } from '../shared/types/view'
import {Page, Browser} from 'puppeteer'

const views: View[] = []
const createView = async (browser: Browser, id: string): Promise<View> => {
  let page: Page
  const pages = await browser.pages()
  // if its the default page, we fetch the current page
  if (pages.length === 1 && views.length === 0 && pages[0].url() === config.DEFAULT_URL) {
    page = pages[0]
  } else {
    page = await browser.newPage()
  }
  const session = await page.target().createCDPSession()
  await session.send('Cast.enable')
  await page.goto(config.DEFAULT_URL)
  return {
    id: id,
    session,
    page
  }
}

const init = async () => {
  // since we use chromium, a warning popup because of the missing creds for google APIs
  process.env.GOOGLE_API_KEY="no"
  process.env.GOOGLE_DEFAULT_CLIENT_ID="no"
  process.env.GOOGLE_DEFAUqLT_CLIENT_SECRET="no"

  if (config.MASTER_WEBSOCKET === undefined) {
    throw new Error(`No master websocket endpoint was configured`)
  }

  // try to connect to websocket master
  const ws = new WebsocketTransport(config.MASTER_WEBSOCKET)

  await ws.connect()
  // setup puppeteer
  puppeteer.use(StealthPlugin())
  const browser = await puppeteer.launch({
    headless: false,
    ignoreDefaultArgs: true,
    executablePath: "/usr/bin/google-chrome",
    args: [
      '--start-fullscreen',
      `--window-position=${config.LAUNCH_POSITION}`,
      '--homepage', config.DEFAULT_URL,
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-features=TranslateUI,BlinkGenPropertyTrees',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--password-store=basic',
      '--use-mock-keychain',
      '--hide-scrollbars',
      '--mute-audio',
    ]
  })
  const sinksAvailable: Sink[] = []

  views.push(await createView(browser, 'default'))
  views[0].session.on('Cast.sinksUpdated', (res: { sinks: Sink[] }) => {
    if (res.sinks.length === 0) return
    const newSinks = res.sinks.filter(sink => sinksAvailable.find(snk => snk.id !== sink.id) === undefined)
    sinksAvailable.push(...newSinks)
    console.log(sinksAvailable)
  })
  

  ws.on('message', async (data) => {
    const packet = await decodeIO(PacketIO, JSON.parse(data))
    console.log(packet)
    packet.ack = true
    switch (packet.type) {
      case PayloadType.SHOW: {
        const payload = await decodeIO(ShowPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        await view.page.goto(payload.url)
        break
      }
      case PayloadType.LIST_SINKS: {
        packet.payload = { sinks: sinksAvailable }
        break
      }
      case PayloadType.LIST_VIEW: {
        packet.payload = { views: views.map(view => ({
          id: view.id,
          currentURL: view.currentURL,
          sink: view.sink
        })) }
        break
      }
      case PayloadType.CREATE_VIEW: {
        const payload = await decodeIO(CreateViewPayloadIO, packet.payload)
        const view = await createView(browser, payload.id)
        views.push(view)
        if (payload.url !== undefined) {
          await view.page.goto(payload.url)
        }
        break
      }
      case PayloadType.CAST_VIEW: {
        const payload = await decodeIO(CastViewPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        const sink = sinksAvailable.find(sink => sink.name === payload.sinkName)
        if (sink === undefined) {
          packet.error = `Failed to find sink with id ${payload.sinkName}`
          break
        }
        await view.session.send('Cast.setSinkToUse', { sinkName: sink.name })
        await view.session.send('Cast.startTabMirroring', { sinkName: sink.name })
        break
      }
    }
    ws.send(packet)
    console.log(packet)
  })
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
  // re-send the packet everytime we get disconnected since the server might have lost us
  ws.on('reconnected', () => {
    ws.send(helloPacket)
  })
  ws.send(helloPacket)
}

init().then(_ => {
  console.log(`Worker is ready to listen messages`)
}).catch(err => {
  console.error(`Failed to start`, err)
  return process.exit(1)
})