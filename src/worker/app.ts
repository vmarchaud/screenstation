
import customEnv from 'custom-env'
customEnv.env(process.env.NODE_ENV)

import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import config from './config'
import { decodeIO } from '../shared/utils/decode'
import { PacketIO, PayloadType, ShowPayloadIO, Packet } from '../shared/types/packets'
import { WebsocketTransport } from '../shared/utils/ws'

const init = async () => {
  // since we use chromium, a warning popup because of the missing creds for google APIs
  process.env.GOOGLE_API_KEY="no"
  process.env.GOOGLE_DEFAULT_CLIENT_ID="no"
  process.env.GOOGLE_DEFAULT_CLIENT_SECRET="no"

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
    args: ["--start-fullscreen", `--window-position=${config.LAUNCH_POSITION}`, '--no-default-browser-check', '--homepage', config.DEFAULT_URL]
  })

  const page = await browser.newPage()
  await page.goto(config.DEFAULT_URL)


  ws.on('message', async (data) => {
    const packet = await decodeIO(PacketIO, JSON.parse(data))
    packet.ack = true
    console.log(packet)
    switch (packet.type) {
      case PayloadType.SHOW: {
        const payload = await decodeIO(ShowPayloadIO, packet.payload)
        await page.goto(payload.url)
        break
      }
    }
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