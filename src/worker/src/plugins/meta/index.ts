import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../../shared/types/packets'
import { promises } from 'fs'
import * as path from 'path'
import { decodeIO } from '../../../../shared/utils/decode'

const MetaPluginConfigIO = t.type({})

export type MetaPluginConfig = t.TypeOf<typeof MetaPluginConfigIO>

enum PayloadType {
  LIST_PLUGINS = 'LIST_PLUGINS'
}

export class MetaPlugin implements Plugin {

  static readonly metadata: PluginMetadata = {
    id: 'core/meta',
    version: '0.1.0',
    displayName: 'Meta plugin',
    installedAt: new Date()
  }

  // @ts-ignore
  private config: MetaPluginConfig
  private store: WorkerStore

  async init (store: WorkerStore) {
    this.store = store
    const configFile = await promises.readFile(path.resolve(__dirname, './config.json'))
    this.config = await decodeIO(MetaPluginConfigIO, JSON.parse(configFile.toString()))
  }

  async getPacketTypes () {
    return Object.values(PayloadType).map(type => ({ type }))
  }

  async getMetadata () {
    return MetaPlugin.metadata
  }

  async handle (packet: Packet) {
    switch (packet.type) {
      case PayloadType.LIST_PLUGINS: {
        packet.payload = {
          plugins: await Promise.all(this.store.plugins.map(async plugin => {
              const metadata = await plugin.getMetadata()
              const packets = await plugin.getPacketTypes()
              return {
                metadata,
                packets
              }
            })
          )
        }
        break
      }
    }
    return packet
  }
}

export default new MetaPlugin()