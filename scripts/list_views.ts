
import WebSocket from 'ws'
import { Packet } from '../src/shared/types/packets'

const ws = new WebSocket('ws://localhost:8000')
const pkt: Packet = {
  type: 'START_STREAM_VIEW',
  sent: new Date(),
  sequence: 0,
  payload: {
    view: 'default',
    worker: 'test',
    timeout: 60 * 1000
  },
  error: undefined,
  ack: undefined
}

ws.on('message', (data) => {
  const json = JSON.parse(data.toString())
  console.log(json)
  if (json.ack === true) {
    ws.close()
  }
})

ws.on('open', () => {
  ws.send(JSON.stringify(pkt))
})
