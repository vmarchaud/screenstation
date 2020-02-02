import WebSocket from 'ws'
import config from './config'
import * as http from 'http'
import { waitWebsocket } from '../shared/utils/common'
import { decodeIO } from '../shared/utils/decode'
import { PacketIO, HelloPayloadIO, Packet } from '../shared/types/packets'

export type WorkerOptions = {
  id: string,
  name: string,
  url?: string,
  version: string,
  sequence: number,
  socket: WebSocket
  ackStore: Map<string, Function>
}

export class Worker {
  readonly id: string
  readonly name: string
  private ackStore: Map<string, Function>

  constructor (private options: WorkerOptions) {
    this.id = options.id
    this.name = options.name
    this.ackStore = options.ackStore
  }
  
  send (packet: Packet, ack: boolean = false): Promise<Packet> {
    return new Promise((resolve, reject) => {
      packet.sequence = this.options.sequence
      this.options.socket.send(JSON.stringify(packet))
      if (ack === true) {
        this.ackStore.set(`${this.options.id}:${packet.sequence}`, (packet: Packet) => {
          return resolve(packet)
        })
        this.options.sequence += 1
      } else {
        this.options.sequence += 1
        return resolve(packet)
      }
    })
  }
}

export class WorkerManager {

  private _server: WebSocket.Server
  readonly clients: Worker[] = []
  private _waitAcks: Map<string, Function> = new Map()

  async init () {
    this._server = new WebSocket.Server({
      port: config.WORKER_WEBSOCKET_PORT
    })
    this._server.on('connection', this.onConnection.bind(this))
    await waitWebsocket(this._server, 'listening')
    console.log(`Worker Websocket server listening on port ${config.WORKER_WEBSOCKET_PORT}`)
  }

  async onConnection (socket: WebSocket, request: http.IncomingMessage) {
    socket.once('message', async (data) => {
      try {
        const packet = await decodeIO(PacketIO, JSON.parse(data))
        console.log(packet)
        if (packet.type !== 'HELLO') return socket.close()
        const payload = await decodeIO(HelloPayloadIO, packet.payload)
        const id = payload.name
        const client = new Worker({
          ...payload,
          id,
          sequence: 0,
          socket,
          ackStore: this._waitAcks
        })
        console.log(`New client ${id} is connected`)
        socket.on('message', this.onMessage.bind(this, client))
        socket.on('error', (err) => {
          console.error(`Error with client ${id}`, err)
          socket.close()
          const idx = this.clients.findIndex(clnt => clnt.id === id)
          if (idx !== -1) {
            this.clients.splice(idx, 1)
          }
        })
        socket.on('close', () => {
          console.error(`Client ${client.id} disconnect`)
          const idx = this.clients.findIndex(clnt => clnt.id === id)
          if (idx !== -1) {
            this.clients.splice(idx, 1)
          }
        })
        this.clients.push(client)
      } catch (err) {
        console.error(err)
        socket.close() 
      }
    })
  }

  async onMessage (client: Worker, data: string) {
    const packet = await decodeIO(PacketIO, JSON.parse(data))
    const waitAckKey = `${client.id}:${packet.sequence}`
    const listener = this._waitAcks.get(waitAckKey)
    if (listener !== undefined && packet.ack === true) {
      listener(packet)
      this._waitAcks.delete(waitAckKey)
    }
    console.log(JSON.stringify(packet, null, 4))
  }
}