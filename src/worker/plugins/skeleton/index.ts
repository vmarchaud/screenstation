import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../shared/types/packets'
import { promises } from 'fs'
import * as path from 'path'
import { decodeIO } from '../../../shared/utils/decode'
import {
  SkeletonPayloadIO
} from './io-types'

const SkeletonPluginConfigIO = t.type({})

export type SkeletonPluginConfig = t.TypeOf<typeof SkeletonPluginConfigIO>

enum PayloadType {
  LIST_VIEW = 'LIST_VIEW'
}

export class SkeletonPlugin implements Plugin {

  static readonly metadata: PluginMetadata = {
    version: '0.1.0',
    displayName: 'core/skeleton',
    installedAt: new Date()
  }

  // @ts-ignore
  private config: SkeletonPluginConfig
  private store: WorkerStore

  async init (store: WorkerStore) {
    this.store = store
    const configFile = await promises.readFile(path.resolve(__dirname, './config.json'))
    this.config = await decodeIO(SkeletonPluginConfigIO, JSON.parse(configFile.toString()))
  }

  async getPacketTypes () {
    return Object.values(PayloadType).map(type => ({ type }))
  }

  async getMetadata () {
    return SkeletonPlugin.metadata
  }

  async handle (packet: Packet) {
    switch (packet.type) {
      case PayloadType.LIST_VIEW: {
        const payload = await decodeIO(SkeletonPayloadIO, packet.payload)
        break
      }
    }
    return packet
  }
}

export default new SkeletonPlugin()