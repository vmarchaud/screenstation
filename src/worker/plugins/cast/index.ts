import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../shared/types/packets'
import { promises } from 'fs'
import * as path from 'path'
import { decodeIO } from '../../../shared/utils/decode'
import {
  CastViewPayloadIO
} from './io-types'
import { Sink } from '../../../shared/types/sink'

const CastPluginConfigIO = t.type({})

export type CastPluginConfig = t.TypeOf<typeof CastPluginConfigIO>

enum PayloadType {
  LIST_SINKS = 'LIST_SINKS',
  CAST_VIEW = 'CAST_VIEW',
}

export class CastPlugin implements Plugin {

  static readonly metadata: PluginMetadata = {
    version: '0.1.0',
    displayName: 'core/cast',
    installedAt: new Date()
  }

  // @ts-ignore
  private config: CastPluginConfig
  private store: WorkerStore
  private sinksAvailable: Sink[] = []

  async init (store: WorkerStore) {
    this.store = store
    const configFile = await promises.readFile(path.resolve(__dirname, './config.json'))
    this.config = await decodeIO(CastPluginConfigIO, JSON.parse(configFile.toString()))
    this.listenForSink()
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
        packet.payload = { sinks: this.sinksAvailable }
        break
      }
      case PayloadType.CAST_VIEW: {
        const payload = await decodeIO(CastViewPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        const sink = this.sinksAvailable.find(sink => sink.name === payload.sinkName)
        if (sink === undefined) {
          packet.error = `Failed to find sink with id ${payload.sinkName}`
          break
        }
        await view.session.send('Cast.setSinkToUse', { sinkName: sink.name })
        await view.session.send('Cast.startTabMirroring', { sinkName: sink.name })
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
      })
    })
  }
}

export default new CastPlugin()