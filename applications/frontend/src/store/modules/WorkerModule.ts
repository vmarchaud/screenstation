import { LoggerFactory } from '@mmit/logging'
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import store from '../index'
import { PayloadType } from '../../../../shared/types/packets'
import WebsocketModule from './WebsocketModule'

@Module({ dynamic: true, namespaced: true, name: WorkerModule.NAME, store })
class WorkerModule extends VuexModule {
  public static readonly NAME = 'workers'
  private readonly logger = LoggerFactory.getLogger(`store.${WorkerModule.NAME}`)

  private _workers: Worker[] = []

  public get workers (): Worker[] {
    return this._workers
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
  private _setWorkers (workers: Worker[]) {
    this._workers = workers
  }
}

type Worker = {
  id: string
  name: string
}

export default getModule(WorkerModule)
