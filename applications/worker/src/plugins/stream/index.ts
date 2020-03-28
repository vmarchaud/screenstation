import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../../shared/types/packets'
import { decodeIO } from '../../../../shared/utils/decode'
import { sleep } from '../../../../shared/utils/common'
import { promises, existsSync } from 'fs'
import * as path from 'path'
import {
  StreamEventPayloadIO,
  StartStreamPayLoadIO,
  StopStreamViewPayLoadIO
} from './io-types'

const StreamPluginConfigIO = t.type({})

export type StreamPluginConfig = t.TypeOf<typeof StreamPluginConfigIO>

enum PayloadType {
  START_STREAM_VIEW = 'START_STREAM_VIEW',
  EVENT_STREAM_VIEW = 'EVENT_STREAM_VIEW',
  STOP_STREAM_VIEW = 'STOP_STREAM_VIEW'
}

export class StreamPlugin implements Plugin {

  static readonly metadata: PluginMetadata = {
    id: 'core/stream',
    version: '0.1.0',
    displayName: 'Remotely access views',
    installedAt: new Date()
  }

  // @ts-ignore
  private config: StreamPluginConfig
  private store: WorkerStore

  async init (store: WorkerStore) {
    this.store = store
    const configPath = path.resolve(this.store.configRootPath, './stream.json')
    if (existsSync(configPath) === false) {
      this.config = {}
    } else {
      const rawConfig = await promises.readFile(configPath)
      this.config = await decodeIO(StreamPluginConfigIO, JSON.parse(rawConfig.toString()))
    }
  }
  
  async destroy () {
    return
  }

  async getPacketTypes () {
    return Object.values(PayloadType).map(type => ({ type }))
  }

  async getMetadata () {
    return StreamPlugin.metadata
  }

  async handle (packet: Packet) {
    const { views } = this.store
    switch (packet.type) {
      case PayloadType.START_STREAM_VIEW: {
        const payload = await decodeIO(StartStreamPayLoadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        await view.page.bringToFront()
        // start sending frames
        view.session.on('Page.screencastFrame', (res) => {
          const sessionId = res.sessionId
          // TODO: we could improve streaming by ack each frame to the final client
          view.session.send('Page.screencastFrameAck', { sessionId })
          // send each frame to our client
          const framePacket = JSON.parse(JSON.stringify(packet))
          framePacket.payload = res
          framePacket.ack = false
          framePacket.sent = new Date()
          return this.store.socket.send(framePacket)
        })
        await view.session.send('Page.startScreencast', {
          everyNthFrame: 2,
          format: 'png'
        })
        // will wait until either we pass the timeout or the stop event is called
        await Promise.race([
          sleep(payload.timeout),
          new Promise((resolve, reject) => {
            const onStopHandler = (viewId: string) => {
              if (viewId !== view.id) return
              this.store.socket.removeListener(PayloadType.STOP_STREAM_VIEW, onStopHandler)
              const selectedView = this.store.views.find(view => view.isSelected)
              if (selectedView) void selectedView.page.bringToFront()
              return resolve()
            }
            this.store.socket.on(PayloadType.STOP_STREAM_VIEW, onStopHandler)
          })
        ])
        // stop sending frames
        await view.session.send('Page.stopScreencast')
        break
      }
      case PayloadType.STOP_STREAM_VIEW: {
        const payload = await decodeIO(StopStreamViewPayLoadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        this.store.socket.emit(PayloadType.STOP_STREAM_VIEW, view.id)
        break
      }
      case PayloadType.EVENT_STREAM_VIEW: {
        const payload = await decodeIO(StreamEventPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        switch (payload.event.type) {
          case 'click': {
            const { x, y } = payload.event.params
            await view.session.send('Input.dispatchMouseEvent', {
              x, y, type: 'mousePressed', button: 'left', clickCount: 1
            })
            await view.session.send('Input.dispatchMouseEvent', {
              x, y, type: 'mouseReleased', button: 'left', clickCount: 1
            })
            break
          }
          case 'keypress': {
            const params = payload.event.params
            await view.session.send('Input.dispatchKeyEvent', params)
            break
          }
          case 'paste': {
            const params = payload.event.params
            await view.session.send('Input.insertText', params)
            break
          }
        }
        break
      }
    }
    return packet
  }
}

export default new StreamPlugin()