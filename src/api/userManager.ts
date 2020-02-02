import WebSocket from 'ws'
import config from './config'
import * as http from 'http'
import { waitWebsocket } from '../shared/utils/common'
import { decodeIO } from '../shared/utils/decode'
import { WorkerManager } from './workerManager'
import { PacketIO, PayloadType } from '../shared/types/packets'

export type Client = {
  socket: WebSocket
}

export class UserManager {

  private _server: WebSocket.Server
  readonly clients: Client[] = []
  private _workerManager: WorkerManager

  async init (manager: WorkerManager) {
    this._workerManager = manager
    this._server = new WebSocket.Server({
      port: config.USER_WEBSOCKET_PORT
    })
    this._server.on('connection', this.onConnection.bind(this))
    await waitWebsocket(this._server, 'listening')
    console.log(`User Websocket server listening on port ${config.USER_WEBSOCKET_PORT}`)
  }

  async onConnection (socket: WebSocket, request: http.IncomingMessage) {
    socket.on('message', this.onMessage.bind(this, [ socket ]))
    socket.on('ping', socket.pong)
    socket.on('error', (err) => {
      socket.close()
    })
  }

  async onMessage (socket: WebSocket, data: string) {
    const packet = await decodeIO(PacketIO, JSON.parse(data))
    console.log(JSON.stringify(packet, null, 4))
    switch (packet.type) {
      case PayloadType.LIST_VIEW: {
        const res = await Promise.all(this._workerManager.clients.map(client => client.send(packet, true)))
        packet.payload = res.map(pkt => pkt.payload)
        break
      }
    }
    packet.ack = true
    packet.sent = new Date()
    socket.send(JSON.stringify(packet))
  }
}