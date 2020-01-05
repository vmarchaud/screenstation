'use strict'

import WebSocket from 'ws'
import * as fs from 'fs'
import Debug from 'debug'
import { EventEmitter } from 'events'

const debug = Debug('transport')

export class WebsocketTransport extends EventEmitter {

  private ws: WebSocket
  private pingInterval: NodeJS.Timer
  private buffer: unknown[] = []
  private maxBufferLength = 500
  /**
   * Construct new websocket instance for specific endpoint
   */
  constructor (private endpoint: string) {
    super()
  }

  /**
   * Connect to websocket server
   */
  connect () {
    return new Promise((resolve, reject) => {
      debug('Connect transporter to websocket server')

    try {
      this.ws = new WebSocket(this.endpoint, {
        perMessageDeflate: false,
        handshakeTimeout: 5 * 1000
      })
    } catch (e) {
      return reject(e)
    }

    const onError = (err: Error) => {
      this.ws.removeAllListeners()
      this.ws.on('error', () => {}) // We need to cache error to avoid timeout after a response
      this.ws.close()
      return reject(err)
    }
    this.ws.once('unexpected-response', (req, res) => {
      this.ws.readyState = this.ws.CLOSED
      debug(`Got a ${res.statusCode} on handshake. Retrying in 5 sec`)
      return onError(new Error(`Handshake failed with ${res.statusCode} HTTP Code.`))
    })
    this.ws.once('error', onError)
    this.ws.once('open', _ => {
      debug('Websocket connected')
      this.ws.removeListener('error', onError)
      this.ws.on('close', this.onClose.bind(this))
      // We don't handle errors (DNS issues...), ping will close/reopen if any error is found
      this.ws.on('error', err => debug(`Got an error with websocket connection: ${err.message}`))
      if (this.pingInterval) clearInterval(this.pingInterval)
      this.pingInterval = setInterval(this.ping.bind(this), process.env.NODE_ENV === 'test' ? 1000 : 10 * 1000) // 30 seconds
      this.clearBuffer()
      return resolve()
    })
    this.ws.on('ping', _ => {
      debug('Received ping! Pong sended!')
      this.ws.pong()
    })
    this.ws.on('message', this.onMessage.bind(this))
    })
  }

  /**
   * When websocket connection is closed, try to reconnect
   */
  async onClose () {
    debug(`Websocket connection is closed, try to reconnect`)
    this.ws.terminate()
    this.ws.removeAllListeners()
    try {
      await this.connect()
    } catch (err) {
      if (err) {
        debug(`Got an error on websocket connection: ${err.message}`)
      } else {
        debug('Websocket connection successfuly reconnected')
        this.emit('reconnected')
      }
    }
  }

  onMessage (rawData: string) {
    return this.emit('message', rawData)
  }

  /**
   * Try to ping server, if we get no response, disconnect and try to reconnect
   */
  ping () {
    if (this.isReconnecting()) return
    const noResponse = async () => {
      clearTimeout(timeout)
      debug('We can\'t get any response to ping from websocket server, trying to reconnect')
      this.ws.terminate()
      try {
        await this.connect()
      } catch (err) {
        if (err) {
          debug(`Got an error on websocket connection: ${err.message}`)
        } else {
          debug('Websocket connection successfuly reconnected')
          this.emit('reconnected')
        }
      }
    }
    const timeout = setTimeout(noResponse.bind(this), 5 * 1000) // 5 seconds timeout

    this.ws.ping((err) => {
      if (err) return noResponse()
      return debug('Successfuly sended a ping!')
    })
    this.ws.on('pong', _ => {
      clearTimeout(timeout)
      this.ws.removeEventListener('pong')
      return debug('Websocket server has replied to ping!')
    })
  }

  /**
   * Send data to websocket server
   * @param {Object} packet Packet to send (send with JSON)
   * @return {Boolean} success
   */
  send (packet: unknown) {
    if (!this.isConnected()) {
      this.bufferPacket(packet)
      return false
    }
    try {
      this.ws.send(JSON.stringify(packet))
    } catch (err) {
      // avoid `Maximum call stack size exceeded` if we fail to send some logs
      if (process.env.DEBUG) fs.writeSync(1, `Failed to send packet: ${err.message}\n`)
      this.bufferPacket(packet)
      return false
    }
    return true
  }

  /**
   * Packet couldn't be send, so buffer it into an array
   * @param {Object} packet Packet to send (send with JSON)
   */
  bufferPacket (packet: unknown) {
    if (this.buffer.length > this.maxBufferLength) this.buffer.pop()
    this.buffer.push(packet)
  }

  /**
   * Send every packet stored in buffer
   */
  clearBuffer () {
    this.buffer.forEach(this.send.bind(this))
  }

  /**
   * Disconnect from websocket server
   */
  disconnect () {
    debug('Disconnect from websocket server')
    if (this.pingInterval) clearInterval(this.pingInterval)
    if (this.ws) {
      this.ws.removeAllListeners('close')
      this.ws.removeAllListeners('error')
      return this.ws.close()
    }
  }

  /**
   * Return if websocket is connected or not
   */
  isConnected () {
    return this.ws && this.ws.readyState === this.ws.OPEN
  }

  /**
   * Return if webcheck is trying to connect or not
   */
  isReconnecting () {
    return this.ws && this.ws.readyState === this.ws.CONNECTING
  }
}