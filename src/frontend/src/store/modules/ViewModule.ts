import { LoggerFactory } from '@mmit/logging'
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import store from '../index'
import { PayloadType } from '../../../../shared/types/packets'
import WebsocketModule from './WebsocketModule'

@Module({ dynamic: true, namespaced: true, name: WorkerModule.NAME, store })
class WorkerModule extends VuexModule {
  public static readonly NAME = 'workers'
  private readonly logger = LoggerFactory.getLogger(`store.${WorkerModule.NAME}`)

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
    return viewsWithScreenshot
  }

  @Action({})
  public async setUrl (url: string, view: View) {
    const res = await WebsocketModule.send({
      type: PayloadType.SHOW,
      payload: {
        worker: view.worker,
        view: view.id,
        url
      }
    })
    console.log(res.payload)
  }

  @Mutation
  private _setViews (views: View[]): void {
    this._views = views
  }
}

export type View = {
  id: string
  worker: string
  currentURL?: string
  screenshot?: string
}

export default getModule(WorkerModule)
