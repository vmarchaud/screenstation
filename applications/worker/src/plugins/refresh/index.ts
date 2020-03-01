import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../../shared/types/packets'
import { decodeIO } from '../../../../shared/utils/decode'
import { promises, existsSync } from 'fs'
import * as path from 'path'
import {
  SetRefreshPayloadIO,
  GetRefreshPayloadIO
} from './io-types'
import { encodeIO } from '../../../../shared/utils/encode'
import of from '../../../../shared/utils/of'

const RefreshEntryIO = t.type({
  view: t.string,
  refreshEvery: t.number
})

type RefreshEntry = t.TypeOf<typeof RefreshEntryIO>

const RefreshPluginConfigIO = t.type({
  entries: t.array(RefreshEntryIO)
})

export type RefreshPluginConfig = t.TypeOf<typeof RefreshPluginConfigIO>

enum PayloadType {
  SET_REFRESH_VIEW = 'SET_REFRESH_VIEW',
  GET_REFRESH_VIEW = 'GET_REFRESH_VIEW'
}

export class RefreshPlugin implements Plugin {

  static readonly metadata: PluginMetadata = {
    id: 'core/refresh',
    version: '0.1.0',
    displayName: 'Auto-refresh view',
    installedAt: new Date()
  }

  // @ts-ignore
  private config: RefreshPluginConfig
  private store: WorkerStore

  private intervalStore: Map<string, NodeJS.Timer> = new Map()

  async init (store: WorkerStore) {
    this.store = store
    const configPath = path.resolve(this.store.configRootPath, './refresh.json')
    if (existsSync(configPath) === false) {
      this.config = { entries: [] }
    } else {
      const rawConfig = await promises.readFile(configPath)
      this.config = await decodeIO(RefreshPluginConfigIO, JSON.parse(rawConfig.toString()))
    }
    for (let entry of this.config.entries) {
      this.intervalStore.set(entry.view, this.getInterval(entry))
    }
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
    return RefreshPlugin.metadata
  }

  async handle (packet: Packet) {
    switch (packet.type) {
      case PayloadType.SET_REFRESH_VIEW: {
        const payload = await decodeIO(SetRefreshPayloadIO, packet.payload)
        const view = this.store.views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        let entry = this.config.entries.find(_entry => _entry.view === payload.view)
        if (entry === undefined) {
          entry = {
            view: payload.view,
            refreshEvery: payload.refreshEvery
          }
          // insert if not found
          this.config.entries.push(entry)
          this.intervalStore.set(entry.view, this.getInterval(entry))
        } else if (payload.refreshEvery <= 0) {
          // if the refreshEvery is 0 or negative, we consider it as a deletion
          this.config.entries = this.config.entries.filter(entry => entry.view === payload.view)
          const interval = this.intervalStore.get(payload.view)
          if (interval === undefined) break
          clearInterval(interval)
          this.intervalStore.delete(payload.view)
        } else {
          // otherwise its just an update
          entry.refreshEvery = payload.refreshEvery
          const interval = this.intervalStore.get(payload.view)
          if (interval === undefined) break
          this.intervalStore.set(payload.view, this.getInterval(entry))
        }
        break
      }
      case PayloadType.GET_REFRESH_VIEW: {
        const payload = await decodeIO(GetRefreshPayloadIO, packet.payload)
        const view = this.store.views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        let entry = this.config.entries.find(entry => entry.view === payload.view)
        if (entry === undefined) {
          entry = {
            refreshEvery: 0,
            view: payload.view
          }
        }
        packet.payload = { refresh: entry }
        break
      }
    }
    return packet
  }

  private getInterval (entry: RefreshEntry) {
    return setInterval(() => {
      const view = this.store.views.find(_view => _view.id === entry.view)
      // cleanup if not found
      if (view === undefined) {
        this.intervalStore.delete(entry.view)
      } else {
        // otherwise reload
        view.page.reload()
      }
    }, entry.refreshEvery)
  }

  private async saveConfig () {
    if (this.config.entries.length === 0) return
    const configPath = path.resolve(this.store.configRootPath, './refresh.json')
    const rawConfig =  await encodeIO(RefreshPluginConfigIO,this.config)
    await promises.writeFile(configPath, rawConfig)
  }
}

export default new RefreshPlugin()