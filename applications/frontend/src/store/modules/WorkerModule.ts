import { LoggerFactory } from '@mmit/logging'
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import store from '../index'
import { PayloadType } from '../../../../shared/types/packets'
import WebsocketModule from './WebsocketModule'
import ViewModule, { View } from './ViewModule'
import Vue from 'vue'

@Module({ dynamic: true, namespaced: true, name: WorkerModule.NAME, store })
class WorkerModule extends VuexModule {
  public static readonly NAME = 'workers'
  private readonly logger = LoggerFactory.getLogger(`store.${WorkerModule.NAME}`)

  private _workers: _Worker[] = []

  public get workers (): Worker[] {
    return this._workers.map(worker => {
      const views = ViewModule.views.filter(view => view.worker === worker.id)
      return Object.assign({}, worker, { views })
    })
  }

  @Action({ commit: '_setWorkers' })
  public async fetch () {
    const res = await WebsocketModule.send({
      type: PayloadType.LIST_WORKERS,
      payload: {}
    })
    return res.payload
  }

  @Mutation
  private _setWorkers (workers: _Worker[]) {
    this._workers = workers
  }
}

// Internal representation without data populated (ie: views)
type _Worker = {
  id: string
  name: string
}

export type Worker = {
  id: string
  name: string
  views: View[]
}

export default getModule(WorkerModule)
