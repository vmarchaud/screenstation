import { LoggerFactory } from '@mmit/logging'
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import store from '../index'
import WebSocketModule from './WebsocketModule'
import { PayloadType } from '../../../../shared/types/packets'

@Module({ dynamic: true, namespaced: true, name: WorkerModule.NAME, store })
class WorkerModule extends VuexModule {
  public static readonly NAME = 'workers'
  private readonly logger = LoggerFactory.getLogger(`store.${WorkerModule.NAME}`)

  private readonly workers: Worker[] = []

  @Action({ commit: '_setWorkers' })
  public async fetch (): Promise<Worker> {
    const res = await WebSocketModule.send({
      type: PayloadType.LIST_VIEW,
      payload: {}
    })
    this.logger.info('Fetch workers', res.payload)
    return []
  }

  @Mutation
  private _setWorkers (success: boolean): void {
    return
  }
}

export type Worker = {

}

export default getModule(WorkerModule)
