import { LoggerFactory } from '@mmit/logging'
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import store from '../index'
import { PayloadType } from '../../../../shared/types/packets'
import WebsocketModule from './WebsocketModule'
import { Sink } from '../../../../shared/types/sink'
import Vue from 'vue'

@Module({ dynamic: true, namespaced: true, name: ViewModule.NAME, store })
class ViewModule extends VuexModule {
  public static readonly NAME = 'views'
  private readonly logger = LoggerFactory.getLogger(`store.${ViewModule.NAME}`)

  private _views: View[] = []

  public get views () {
    return this._views
  }

  @Action({ commit: '_setViews' })
  public async fetch () {
    const res = await WebsocketModule.send({
      type: PayloadType.LIST_VIEW,
      payload: {}
    })
    const views: View[] = (res.payload as any[]).flatMap(workerResp => {
      return workerResp.views
    })
    this.logger.info('Set views', views)
    const viewsWithScreenshot = await Promise.all(views.map(async view => {
      const res = await WebsocketModule.send({
        type: PayloadType.GET_VIEW,
        payload: {
          worker: view.worker,
          view: view.id
        }
      })
      const screenshot = (res.payload as any)[0].screenshot
      view.screenshot = `data:image/png;base64,${screenshot}`
      return view
    }))
    viewsWithScreenshot.forEach(view => {
      void this.fetchViewCapabilities(view)
      // @ts-ignore
      view.capabilities = {}
      view.sinks = []
    })
    return viewsWithScreenshot
  }

  @Action({ commit: '_setViewContent' })
  public async fetchCurrentContent (view: View) {
    const res = await WebsocketModule.send({
      type: PayloadType.GET_VIEW,
      payload: {
        worker: view.worker,
        view: view.id
      }
    })
    const payload = (res.payload as any)[0]
    view.screenshot = `data:image/png;base64,${payload.screenshot}`
    view.currentURL = payload.currentURL ?? view.currentURL
    return view
  }

  @Action({ commit: '_setViewCapabilities' })
  public async fetchViewCapabilities (view: View): Promise<{ view: string, capabilities: ViewCapabilities }> {
    const res = await WebsocketModule.send({
      type: PayloadType.LIST_PLUGINS,
      payload: {
        worker: view.worker
      }
    })
    const plugins = (res.payload as any)[0].plugins
    const capabilities: ViewCapabilities = {
      refresh: plugins.some((plugin: any) => plugin.metadata.id === 'core/refresh'),
      cast: plugins.some((plugin: any) => plugin.metadata.id === 'core/cast'),
      stream: plugins.some((plugin: any) => plugin.metadata.id === 'core/stream')
    }

    if (capabilities.refresh) {
      void this.fetchViewRefresh(view)
    }
    if (capabilities.cast) {
      void this.fetchViewSinks(view)
    }

    return {
      view: view.id,
      capabilities
    }
  }

  @Action({ commit: '_setViewRefresh' })
  public async fetchViewRefresh (view: View) {
    const res = await WebsocketModule.send({
      type: PayloadType.GET_REFRESH_VIEW,
      payload: {
        worker: view.worker,
        view: view.id
      }
    })
    const payload = (res.payload as any)[0]
    return { refreshEvery: payload.refresh.refreshEvery, view }
  }

  @Action({ commit: '_setViewSinks' })
  public async fetchViewSinks (view: View) {
    const res = await WebsocketModule.send({
      type: PayloadType.LIST_SINKS,
      payload: {
        worker: view.worker,
        view: view.id
      }
    })
    const payload = (res.payload as any)[0]
    const currentlyUsed = payload.currentlyUsed
    for (let usedSink of currentlyUsed) {
      this.context.commit('_setViewSinkInUse', {
        view: usedSink[0],
        sink: usedSink[1]
      })
    }
    return { sinks: payload.sinks, view }
  }

  @Action({})
  public async setUrl ({ url, view }: { url: string, view: View }) {
    const res = await WebsocketModule.send({
      type: PayloadType.SET_VIEW_URL,
      payload: {
        worker: view.worker,
        view: view.id,
        url
      }
    })
    void this.fetchCurrentContent(view)
  }

  @Action({ commit: '_setViewRefresh' })
  public async setRefreshOnView ({ refresh, view }: { refresh: number, view: View }) {
    const res = await WebsocketModule.send({
      type: PayloadType.SET_REFRESH_VIEW,
      payload: {
        worker: view.worker,
        view: view.id,
        refreshEvery: refresh
      }
    })
    return { refreshEvery: refresh, view }
  }

  @Action({ commit: '_setViewSinkInUse' })
  public async setSinkForView ({ sink, view }: { sink: Sink, view: View }) {
    const res = await WebsocketModule.send({
      type: PayloadType.SELECT_SINK,
      payload: {
        worker: view.worker,
        view: view.id,
        sink: sink.name
      }
    })
    return { view: view.id, sink: sink.name }
  }

  @Action({ commit: '_setViewSinkInUse' })
  public async stopSinkForView ({ view }: { view: View }) {
    const res = await WebsocketModule.send({
      type: PayloadType.STOP_SINK,
      payload: {
        worker: view.worker,
        view: view.id
      }
    })
    return { view: view.id, sink: undefined }
  }

  @Action({})
  public async setViewAsActive ({ view }: { view: View }) {
    const res = await WebsocketModule.send({
      type: PayloadType.SELECT_VIEW,
      payload: {
        worker: view.worker,
        view: view.id
      }
    })
    void this.fetch()
  }

  @Action({})
  public async createView (worker: string) {
    const res = await WebsocketModule.send({
      type: PayloadType.CREATE_VIEW,
      payload: {
        worker
      }
    })
  }

  @Mutation
  private _setViews (views: View[]): void {
    this._views = views
  }

  @Mutation
  private _setViewContent (view: View): void {
    this._views.forEach(_view => {
      if (_view.id !== view.id || _view.worker !== view.worker) return
      if (view.currentURL) {
        _view.currentURL = view.currentURL
      }
      if (view.screenshot) {
        _view.screenshot = view.screenshot
      }
    })
  }

  @Mutation
  private _setViewRefresh (payload: { refreshEvery: number, view: View}): void {
    if (payload.view.refresh === undefined) {
      payload.view.refresh = { refreshEvery: payload.refreshEvery }
    } else {
      payload.view.refresh.refreshEvery = payload.refreshEvery
    }
  }

  @Mutation
  private _setViewSinks (payload: { sinks: Sink[], view: View}): void {
    const view = this._views.find(view => payload.view.id === view.id)
    if (view === undefined) return
    Vue.set(view, 'sinks', payload.sinks)
  }

  @Mutation
  private _setViewCapabilities (payload: { view: string, capabilities: ViewCapabilities }): void {
    const view = this._views.find(_view => _view.id === payload.view)
    if (view === undefined) return
    view.capabilities = payload.capabilities
  }

  @Mutation
  private _setViewSinkInUse (payload: { view: string, sink: string }): void {
    const view = this._views.find(_view => _view.id === payload.view)
    if (view === undefined) return
    Vue.set(view, 'currentSink', payload.sink)
  }
}

export type ViewCapabilities = {
  refresh: boolean,
  cast: boolean,
  stream: boolean
}

export type View = {
  id: string
  worker: string
  currentURL?: string
  screenshot?: string
  refresh?: {
    refreshEvery: number
  },
  capabilities: ViewCapabilities
  sinks: Sink[]
  currentSink?: string
  isSelected: boolean
}

export default getModule(ViewModule)
