
import WebSocket from 'ws'
import { Packet } from '../src/shared/types/packets'

const ws = new WebSocket('ws://localhost:8000')
const pkt: Packet = {
  type: 'SHOW',
  sent: new Date(),
  sequence: 0,
  payload: {
    view: 'default',
    url: 'http://google.fr'
  },
  error: undefined,
  ack: undefined
}

ws.on('message', (data) => {
  const json = JSON.parse(data.toString())
  console.log(json)
  ws.close()
})

ws.on('open', () => {
  ws.send(JSON.stringify(pkt))
})
