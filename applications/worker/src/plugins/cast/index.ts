import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../../shared/types/packets'
import { decodeIO } from '../../../../shared/utils/decode'
import { promises, existsSync } from 'fs'
import * as path from 'path'
import {
  CastViewPayloadIO,
  StopCastViewPayloadIO
} from './io-types'
import { Sink } from '../../../../shared/types/sink'
import { encodeIO } from '../../../../shared/utils/encode'
import of from '../../../../shared/utils/of'

const CastPluginConfigIO = t.type({
  sinkUsed: t.array(t.array(t.string))
})

export type CastPluginConfig = t.TypeOf<typeof CastPluginConfigIO>

enum PayloadType {
  LIST_SINKS = 'LIST_SINKS',
  SELECT_SINK = 'SELECT_SINK',
  STOP_SINK = 'STOP_SINK'
}

export class CastPlugin implements Plugin {

  static readonly metadata: PluginMetadata = {
    id: 'core/cast',
    version: '0.1.0',
    displayName: 'Cast view to chromecast',
    installedAt: new Date()
  }

  // @ts-ignore
  private config: CastPluginConfig
  private store: WorkerStore
  private sinksAvailable: Sink[] = []
  private currentSinkUsed: Map<string, string> = new Map()

  async init (store: WorkerStore) {
    this.store = store
    const configPath = path.resolve(this.store.configRootPath, './cast.json')
    if (existsSync(configPath) === false) {
      this.config = { sinkUsed: [] }
    } else {
      const rawConfig = await promises.readFile(configPath)
      this.config = await decodeIO(CastPluginConfigIO, JSON.parse(rawConfig.toString()))
    }
    this.listenForSink()
    // save config every 5min in case we abrubtly shutdown
    setInterval(() => {
      void of(this.saveConfig())
    }, 1000 * 60 * 5)
  }

  async destroy () {
    await this.saveConfig()
  }

  async getPacketTypes () {
    return Object.values(PayloadType).map(type => ({ type }))
  }

  async getMetadata () {
    return CastPlugin.metadata
  }

  async handle (packet: Packet) {
    const { views } = this.store
    switch (packet.type) {
      case PayloadType.LIST_SINKS: {
        packet.payload = {
          sinks: this.sinksAvailable,
          currentlyUsed: Array.from(this.currentSinkUsed.entries())
        }
        break
      }
      case PayloadType.SELECT_SINK: {
        const payload = await decodeIO(CastViewPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        const sink = this.sinksAvailable.find(sink => sink.name === payload.sink)
        if (sink === undefined) {
          packet.error = `Failed to find sink with id ${payload.sink}`
          break
        }
        await view.session.send('Cast.setSinkToUse', { sinkName: sink.name })
        await view.session.send('Cast.startTabMirroring', { sinkName: sink.name })
        this.currentSinkUsed.set(view.id, sink.name)
        void this.saveConfig()
        break
      }
      case PayloadType.STOP_SINK: {
        const payload = await decodeIO(StopCastViewPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        const currentSink = this.currentSinkUsed.get(payload.view)
        if (currentSink === undefined) break
        await view.session.send('Cast.stopCasting', { sinkName: currentSink })
        this.currentSinkUsed.delete(payload.view)
        void this.saveConfig()
        break
      }
    }
    return packet
  }

  private listenForSink () {
    const view = this.store.views[0]
    view.session.on('Cast.sinksUpdated', (res: { sinks: Sink[] }) => {
      if (res.sinks.length === 0) return
      res.sinks.map(sink => {
        const idMatches = sink.id.match(/:<(.*)>/)
        sink.id = idMatches !== null ? idMatches[1] : sink.id
        return sink
      }).forEach(sink => {
        const previousSinkIdx = this.sinksAvailable.findIndex(snk => snk.id === sink.id)
        if (previousSinkIdx === -1) {
          this.sinksAvailable.push(sink)
        } else {
          this.sinksAvailable.splice(previousSinkIdx, 1, sink)
        }
        // if we previously had a cast registered but we dont currently
        // cast the view to id
        const viewUsed = this.config.sinkUsed.find(sinkUse => sinkUse[1] === sink.name)
        if (viewUsed === undefined) return
        const viewId = viewUsed[0]
        if (this.currentSinkUsed.has(viewId)) return
        void this.handle({
          type: 'SELECT_SINK',
          payload: {
            sink: sink.name,
            view: viewId,
            worker: this.store.workerName
          },
          sent: new Date(),
          ack: false,
          error: undefined,
          sequence: -1
        })
      })
    })
  }

  private async saveConfig () {
    const configPath = path.resolve(this.store.configRootPath, './cast.json')
    this.config.sinkUsed = Array.from(this.currentSinkUsed.entries())
    const serializedConfig = await encodeIO(CastPluginConfigIO, this.config)
    const rawConfig = JSON.stringify(serializedConfig)
    await promises.writeFile(configPath, rawConfig)
  }
}

export default new CastPlugin()