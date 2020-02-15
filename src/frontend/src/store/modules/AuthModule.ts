import { LoggerFactory } from '@mmit/logging'
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import store from '../index'

export interface Credential {
  username: string
  password: string
}

@Module({ dynamic: true, namespaced: true, name: AuthModule.NAME, store })
class AuthModule extends VuexModule {
  public static readonly NAME = 'auth'

  private readonly logger = LoggerFactory.getLogger('store.AuthModule')

  private readonly credentials: Credential[] = [{ username: 'guest4@shiro.at', password: 'guest123B?' }]
  private _loggedIn = false

  public get isAuthenticated (): boolean {
    return true
  }

  // action 'login' commits mutation '_login' when done with return value as payload
  // Action kann nur EINEN Parameter haben - Payload!
  @Action({ commit: '_login' })
  public async login (payload: Credential): Promise<boolean> {
    const found = this.credentials.find((credential) => {
      const isEqual = credential.username === payload.username && credential.password === payload.password
      return isEqual
    })

    return found !== undefined
  }

  // action 'logout' commits mutation '_logout' when done with return value as payload
  @Action({ commit: '_logout' })
  public async logout (): Promise<boolean> {
    return true
  }

  // - Keep all the Mutations private - we don't want to call Mutations directly -----------------

  @Mutation
  private _login (success: boolean): void {
    this.logger.info(`Success! (${success})`)
    this._loggedIn = success
  }

  @Mutation
  private _logout (payload: boolean): void {
    this._loggedIn = false
  }
}

export default getModule(AuthModule)
