import * as t from 'io-ts'
import { Plugin, PluginMetadata } from '../../types'
import { WorkerStore } from '../../types'
import { Packet } from '../../../../shared/types/packets'
import { decodeIO } from '../../../../shared/utils/decode'
import { encodeIO } from '../../../../shared/utils/encode'
import { promises, existsSync } from 'fs'
import * as path from 'path'
import {
  CreateViewPayloadIO,
  DeleteViewPayloadIO,
  GetViewPayloadIO,
  SetViewUrlPayloadIO
} from './io-types'
import of from '../../../../shared/utils/of'

const SavedViewIO = t.type({
  id: t.string,
  currentURL: t.union([ t.undefined, t.string ])
})

const ViewPluginConfigIO = t.type({
  default_url: t.string,
  savedViews: t.array(SavedViewIO)
})

export type ViewPluginConfig = t.TypeOf<typeof ViewPluginConfigIO>

enum PayloadType {
  GET_VIEW = 'GET_VIEW',
  CREATE_VIEW = 'CREATE_VIEW',
  LIST_VIEW = 'LIST_VIEW',
  DELETE_VIEW = 'DELETE_VIEW',
  SELECT_VIEW = 'SELECT_VIEW',
  SET_VIEW_URL = 'SET_VIEW_URL'
}

export class ViewPlugin implements Plugin {

  static readonly metadata: PluginMetadata = {
    id: 'core/views',
    version: '0.1.0',
    displayName: 'Chrome views plugin',
    installedAt: new Date()
  }

  private config: ViewPluginConfig
  private store: WorkerStore

  async init (store: WorkerStore) {
    this.store = store
    const configPath = path.resolve(this.store.configRootPath, './views.json')
    if (existsSync(configPath) === false) {
      // use a default config
      this.config = {
        default_url: 'https://google.com',
        savedViews: []
      }
    } else {
      const rawConfig = await promises.readFile(configPath)
      this.config = await decodeIO(ViewPluginConfigIO, JSON.parse(rawConfig.toString()))
    }
    
    await this.restoreViews()
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
    return ViewPlugin.metadata
  }

  async handle (packet: Packet) {
    const { views } = this.store
    switch (packet.type) {
      case PayloadType.LIST_VIEW: {
        packet.payload = { views: views.map(view => ({
          id: view.id,
          worker: this.store.workerName,
          currentURL: view.currentURL,
          sink: view.sink
        })) }
        break
      }
      case PayloadType.CREATE_VIEW: {
        const payload = await decodeIO(CreateViewPayloadIO, packet.payload)
        const view = await this.createView(payload.name)
        views.push(view)
        if (payload.url !== undefined) {
          await view.page.goto(payload.url)
        }
        break
      }
      case PayloadType.GET_VIEW: {
        const payload = await decodeIO(GetViewPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        const screenshot = await view.session.send('Page.captureScreenshot', {
          format: 'jpeg',
          quality: 40
        })
        packet.payload = {
          screenshot: (screenshot as any).data,
          currentURL: view.page.url()
        }
        break
      }
      case PayloadType.DELETE_VIEW: {
        const payload = await decodeIO(DeleteViewPayloadIO, packet.payload)
        const viewIndex = views.findIndex(view => view.id === payload.view)
        if (viewIndex === -1) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        const view = views[viewIndex]
        await view.page.close()
        views.splice(viewIndex, 1)
        break
      }
      case PayloadType.SELECT_VIEW: {
        const payload = await decodeIO(DeleteViewPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        await view.page.bringToFront()
        break
      }
      case PayloadType.SET_VIEW_URL: {
        const payload = await decodeIO(SetViewUrlPayloadIO, packet.payload)
        const view = views.find(view => view.id === payload.view)
        if (view === undefined) {
          packet.error = `Failed to find view with id ${payload.view}`
          break
        }
        view.currentURL = payload.url
        await view.page.goto(payload.url)
        break
      }
    }
    return packet
  }

  private async restoreViews () {
    // create a default view if none exist
    if (this.config.savedViews.length === 0) {
      const defaultView = await this.createView('default')
      this.store.views.push(defaultView)
      return
    }

    for (let savedView of this.config.savedViews) {
      const view = await this.createView(savedView.id, savedView.currentURL)
      this.store.views.push(view)
    }
  }

  private async createView (name: string, url?: string) {
    const page = await this.store.browser.newPage()
    const session = await page.target().createCDPSession()
    await session.send('Cast.enable')
    await page.goto(url || this.config.default_url)
    return {
      id: name,
      currentURL: url || this.config.default_url,
      session,
      page
    }
  }

  private async saveConfig () {
    const configPath = path.resolve(this.store.configRootPath, './views.json')
    this.config.savedViews = this.store.views.map(view => {
      return {
        id: view.id,
        currentURL: view.currentURL,
        sink: view.sink !== undefined ? view.sink.name : undefined
      }
    })
    const serializedConfig = await encodeIO(ViewPluginConfigIO, this.config)
    const rawConfig = JSON.stringify(serializedConfig)
    await promises.writeFile(configPath, rawConfig)
  }
}

export default new ViewPlugin()