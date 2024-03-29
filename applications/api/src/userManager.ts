import WebSocket from 'ws'
import config from './config'
import * as http from 'http'
import { waitWebsocket } from '../../shared/utils/common'
import { decodeIO } from '../../shared/utils/decode'
import { WorkerManager } from './workerManager'
import { PacketIO, PayloadType } from '../../shared/types/packets'

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
    socket.on('message', this.onMessage.bind(this, socket))
    socket.on('ping', socket.pong)
    socket.on('error', (err) => {
      socket.close()
    })
  }

  async onMessage (socket: WebSocket, data: string) {
    const packet = await decodeIO(PacketIO, JSON.parse(data))
    const target = (packet.payload as any).worker as string | undefined
    const targets = target === undefined ?
      this._workerManager.clients : this._workerManager.clients.filter(client => client.name === target)
    if (targets === undefined) {
      packet.error = `Cant find specified worker`
      packet.ack = true
      return socket.send(JSON.stringify(packet))
    }
    switch (packet.type) {
      case PayloadType.LIST_WORKERS: {
        packet.payload = this._workerManager.clients.map(worker => {
          return { id: worker.id, name: worker.name }
        })
        break
      }
      case PayloadType.START_STREAM_VIEW: {
        if (targets.length > 1) {
          packet.error = `Cant target multiple worker for stream`
          packet.ack = true
          return socket.send(JSON.stringify(packet))
        }
        const worker = targets[0]
        const res = await worker.startTransaction(packet, (transactionPacket) => {
          transactionPacket.sequence = packet.sequence
          socket.send(JSON.stringify(transactionPacket))
        })
        packet.payload = res.payload
        break
      }
      default: {
        const res = await Promise.all(targets.map(client => (
          client.send(JSON.parse(JSON.stringify(packet)), true)
        )))
        packet.payload = res.map((pkt, idx) => {
          return Object.assign({ worker: targets[idx].id }, pkt.payload)
        })
      }
    }
    packet.ack = true
    packet.sent = new Date()
    socket.send(JSON.stringify(packet))
  }
}