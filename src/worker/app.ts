
import customEnv from 'custom-env'
customEnv.env(process.env.NODE_ENV)

import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import config from './config'
import { decodeIO } from '../shared/utils/decode'
import { PacketIO, PayloadType, ShowPayloadIO, Packet, CreateViewPayloadIO, CastViewPayloadIO, StartStreamPayLoadIO, StopStreamViewPayLoadIO, StreamEventPayloadIO } from '../shared/types/packets'
import { WebsocketTransport } from '../shared/utils/ws'
import { Sink } from '../shared/types/sink'
import { View } from '../shared/types/view'
import {Page, Browser} from 'puppeteer'
import { sleep } from '../shared/utils/common'
import of from '../shared/utils/of'

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
    currentURL: config.DEFAULT_URL.includes('?') ?
      config.DEFAULT_URL.split('?')[0] : config.DEFAULT_URL,
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
    res.sinks.map(sink => {
      const idMatches = sink.id.match(/:<(.*)>/)
      sink.id = idMatches !== null ? idMatches[1] : sink.id
      return sink
    }).forEach(sink => {
      const previousSinkIdx = sinksAvailable.findIndex(snk => snk.id === sink.id)
      if (previousSinkIdx === -1) {
        sinksAvailable.push(sink)
      } else {
        sinksAvailable.splice(previousSinkIdx, 1, sink)
      }
    })
  })
  

  ws.on('message', async (data) => {
    const [ packet, err ] = await of(decodeIO(PacketIO, JSON.parse(data)))
    if (packet === undefined) return
    if (err) {
      packet.error = err.message || `Failed to decode`
      packet.ack = true
      return ws.send(packet)
    }
    console.log(packet)
    switch (packet.type) {
      case PayloadType.SHOW: {
        const [payload, err] = await of(decodeIO(ShowPayloadIO, packet.payload))
        if (payload === undefined || err) {
          packet.error = err ? err.message : `Failed to decode`
          packet.ack = true
          return ws.send(packet)
        }
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
          worker: config.NAME,
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
      case PayloadType.START_STREAM_VIEW: {
        const payload = await decodeIO(StartStreamPayLoadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        // start sending frames
        view.session.on('Page.screencastFrame', (res) => {
          console.log(`Sending frame ${res.sessionId} for view ${view.id}`)
          const sessionId = res.sessionId
          // TODO: we could improve streaming by ack each frame to the final client
          view.session.send('Page.screencastFrameAck', { sessionId })
          // send each frame to our client
          const framePacket = JSON.parse(JSON.stringify(packet))
          framePacket.payload = res
          framePacket.ack = false
          framePacket.sent = new Date()
          return ws.send(framePacket)
        })
        await view.session.send('Page.startScreencast', {
          everyNthFrame: 2,
          format: 'png'
        })
        // will wait until either we pass the timeout or the stop event is called
        await Promise.race([
          sleep(payload.timeout),
          new Promise((resolve, reject) => {
            const onStopHandler = (viewId: string) => {
              if (viewId !== view.id) return
              ws.removeListener(PayloadType.STOP_STREAM_VIEW, onStopHandler)
              return resolve()
            }
            ws.on(PayloadType.STOP_STREAM_VIEW, onStopHandler)
          })
        ])
        // stop sending frames
        await view.session.send('Page.stopScreencast')
        break
      }
      case PayloadType.STOP_STREAM_VIEW: {
        const payload = await decodeIO(StopStreamViewPayLoadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        ws.emit(PayloadType.STOP_STREAM_VIEW, view.id)
        break
      }
      case PayloadType.EVENT_STREAM_VIEW: {
        const payload = await decodeIO(StreamEventPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        switch (payload.event.type) {
          case 'click': {
            const { x, y } = payload.event.params
            await view.session.send('Input.dispatchMouseEvent', {
              x, y, type: 'mousePressed', button: 'left', clickCount: 1
            })
            await view.session.send('Input.dispatchMouseEvent', {
              x, y, type: 'mouseReleased', button: 'left', clickCount: 1
            })
            break
          }
          case 'rawKeyDown': {
            const params = payload.event.params
            await view.session.send('Input.dispatchKeyEvent', params)
            break
          }
        }
        break
      }
    }
    packet.ack = true
    packet.sent = new Date()
    ws.send(packet)
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