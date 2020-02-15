import { LoggerFactory } from '@mmit/logging'
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import store from '../index'
import WSModule from './WebsocketModule'
import WorkerModule from './WorkerModule'

@Module({ dynamic: true, namespaced: true, name: InitModule.NAME, store })
class InitModule extends VuexModule {
  public static readonly NAME = 'init'
  private readonly logger = LoggerFactory.getLogger(`store.${InitModule.NAME}`)

  private _loaded: boolean = false

  public get isLoaded () {
    return this._loaded
  }

  @Action({ commit: 'setLoaded' })
  public async init (): Promise<boolean> {
    await WSModule.connect()
    await WorkerModule.fetch()
    return true
  }

  @Mutation
  private setLoaded (state: boolean): void {
    this._loaded = state
  }
}

export default getModule(InitModule)
