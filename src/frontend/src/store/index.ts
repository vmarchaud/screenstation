import { RootState } from '@/store/interfaces/RootState'
import { isNotRegistered } from '@/store/utils'
import Vue from 'vue'
import Vuex, { ActionContext, ActionTree, MutationTree } from 'vuex'
import { getModule } from 'vuex-module-decorators'

// import gameModule from './modules/GameModule';

Vue.use(Vuex)

const state: RootState = {
  loaded: false
}

const actions: ActionTree<RootState, RootState> = {
  async readyState (context: ActionContext<RootState, RootState>, payload: undefined): Promise<void> {
    setTimeout(() => {
      context.commit('readyState', true)
    }, 200)
  }
}

/**
 * Mutations are synchronous
 */
const mutations: MutationTree<RootState> = {
  readyState (status: RootState, payload): void {
    status.loaded = true
  }
}

const store = new Vuex.Store<RootState>({
  state,
  actions,
  mutations
  // modules: {
  //     gameModule,
  // },
})

export default store
