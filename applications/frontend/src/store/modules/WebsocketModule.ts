import { LoggerFactory } from '@mmit/logging'
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import store from '../index'
import { Packet } from '../../../../shared/types/packets'

let websocket: WebSocket | null = null
let ackStore: Map<number, (packet: Packet) => void> = new Map()
let sequence: number = 0

const onMessage = (message: MessageEvent) => {
  try {
    const packet = JSON.parse(message.data) as Packet
    console.log(`Received packet ${packet.type} (seq:${packet.sequence},ack:${packet.ack})`)
    const listener = ackStore.get(packet.sequence)
    if (listener !== undefined) {
      listener(packet)
    } else {
      console.warn(`Received packet ${packet.type} (seq:${packet.sequence},ack:${packet.ack}) without listener`)
    }
  } catch (err) {
    return console.error(err)
  }
}

type PacketToSend = Omit<Omit<Omit<Omit<Packet, 'sequence'>, 'ack'>, 'error'>, 'sent'>

@Module({ dynamic: true, namespaced: true, name: WSModule.NAME, store })
class WSModule extends VuexModule {
  public static readonly NAME = 'ws'

  private readonly logger = LoggerFactory.getLogger(`store.${WSModule.NAME}`)

  public get isConnected (): boolean {
    return websocket?.readyState === WebSocket.OPEN
  }
  private address: string = 'ws://api-screenstation.local:8000'

  @Action({})
  public async connect (): Promise<boolean> {
    return new Promise((resolve, reject) => {
      websocket = new WebSocket(this.address)
      this.logger.info(`Websocket client created`)
      websocket.onmessage = onMessage
      websocket.onopen = () => {
        this.logger.info(`Websocket client connected`)
        return resolve()
      }
      websocket.onerror = reject
    })
  }

  @Action({})
  public async send (input: PacketToSend, ack: boolean = true): Promise<Packet> {
    return new Promise((resolve, reject) => {
      if (this.isConnected === false || websocket === null) {
        throw new Error(`Not connected`)
      }
      const packet = input as Packet
      packet.sequence = sequence
      packet.sent = new Date()
      packet.ack = false
      packet.error = undefined
      this.logger.info(`Sending message ${input.type} (seq:${packet.sequence},waitAck:${ack})`)
      if (ack === false) {
        websocket.send(JSON.stringify(packet))
        sequence += 1
        return resolve(packet)
      } else {
        ackStore.set(sequence, (packet: Packet) => {
          ackStore.delete(packet.sequence)
          return resolve(packet)
        })
        websocket.send(JSON.stringify(packet))
        sequence += 1
      }
    })
  }

  @Action({})
  public async transaction (
    { input, callback }: { input: PacketToSend, callback: (packet: Packet) => void}
  ): Promise<Packet> {
    return new Promise((resolve, reject) => {
      if (this.isConnected === false || websocket === null) {
        throw new Error(`Not connected`)
      }
      const packet = input as Packet
      packet.sequence = sequence
      packet.sent = new Date()
      packet.ack = false
      packet.error = undefined
      this.logger.info(`Sending message ${input.type} (seq:${packet.sequence},tx)`)
      websocket.send(JSON.stringify(packet))
      ackStore.set(sequence, (packet: Packet) => {
        if (packet.ack === true) {
          ackStore.delete(packet.sequence)
          return resolve(packet)
        }
        return callback(packet)
      })
      sequence += 1
      return resolve(packet)
    })
  }

  @Action({})
  public async disconnect (): Promise<boolean> {
    return true
  }
}

export default getModule(WSModule)
