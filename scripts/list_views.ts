
import WebSocket from 'ws'
import { Packet } from '../src/shared/types/packets'

const ws = new WebSocket('ws://localhost:8000')
const pkt: Packet = {
  type: 'LIST_VIEW',
  sent: new Date(),
  sequence: 1,
  payload: {},
  error: undefined,
  ack: undefined
}

ws.on('open', () => {
  ws.send(JSON.stringify(pkt))
})
ws.on('message', (data) => {
  const json = JSON.parse(data.toString())
  console.log(json)
})

