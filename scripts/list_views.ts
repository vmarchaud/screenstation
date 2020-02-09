
import WebSocket from 'ws'
import { Packet } from '../src/shared/types/packets'

const ws = new WebSocket('ws://localhost:8000')
const pkt: Packet = {
  type: 'CAST_VIEW',
  sent: new Date(),
  sequence: 0,
  payload: {
    view: 'default',
    worker: 'test',
    sinkName: "Dev's room TV"
  },
  error: undefined,
  ack: undefined
}

ws.on('message', (data) => {
  const json = JSON.parse(data.toString())
  console.log(JSON.stringify(json, null, 4))
  if (json.ack === true) {
    ws.close()
  }
})

ws.on('open', () => {
  ws.send(JSON.stringify(pkt))
})
