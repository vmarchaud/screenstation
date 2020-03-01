import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../../shared/types/packets'
import { decodeIO } from '../../../../shared/utils/decode'
import { promises, existsSync } from 'fs'
import * as path from 'path'

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
    const configPath = path.resolve(this.store.configRootPath, './meta.json')
    if (existsSync(configPath) === false) {
      this.config = {}
    } else {
      const rawConfig = await promises.readFile(configPath)
      this.config = await decodeIO(MetaPluginConfigIO, JSON.parse(rawConfig.toString()))
    }
  }

  async destroy () {
    return
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