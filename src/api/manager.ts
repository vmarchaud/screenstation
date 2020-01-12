import WebSocket from 'ws'
import config from './config'
import * as http from 'http'
import httpErrors from 'http-errors'
import { waitWebsocket } from '../shared/utils/common'
import { decodeIO } from '../shared/utils/decode'
import { PacketIO, HelloPayloadIO, Packet } from '../shared/types/packets'

export type Client = {
  id: string,
  name: string,
  url?: string,
  version: string,
  socket: WebSocket
}

export class Manager {

  private _server: WebSocket.Server
  readonly clients: Client[] = []

  async init () {
    this._server = new WebSocket.Server({
      port: config.WEBSOCKET_PORT
    })
    this._server.on('connection', this.onConnection.bind(this))
    await waitWebsocket(this._server, 'listening')
    console.log(`Websocket server listening on port ${config.WEBSOCKET_PORT}`)
  }

  async onConnection (socket: WebSocket, request: http.IncomingMessage) {
    socket.once('message', async (data) => {
      try {
        const packet = await decodeIO(PacketIO, JSON.parse(data))
        console.log(packet)
        if (packet.type !== 'HELLO') return socket.close()
        const payload = await decodeIO(HelloPayloadIO, packet.payload)
        const id = payload.name
        const client: Client = {
          ...payload,
          id,
          socket
        }
        console.log(`New client ${client.id} is connected`)
        socket.on('message', this.onMessage.bind(this, [ client ]))
        socket.on('error', (err) => {
          console.error(`Error with client ${client.id}`, err)
          socket.close()
          const idx = this.clients.findIndex(clnt => clnt.id === client.id)
          if (idx !== -1) {
            this.clients.splice(idx, 1)
          }
        })
        socket.on('close', () => {
          console.error(`Client ${client.id} disconnect`)
          const idx = this.clients.findIndex(clnt => clnt.id === client.id)
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

  async onMessage (client: Client, data: string) {
    const packet = await decodeIO(PacketIO, JSON.parse(data))
    console.log(JSON.stringify(packet, null, 4))
  }

  async sendMessage (clientId: string, packet: Packet) {
    const client = this.clients.find(clnt => clnt.id === clientId)
    if (client === undefined) throw new httpErrors.NotFound(`Cannot find client ${clientId}`)
    client.socket.send(JSON.stringify(packet))
  }
}