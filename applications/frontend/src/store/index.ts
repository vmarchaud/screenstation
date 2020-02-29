import { isNotRegistered } from '@/store/utils'
import Vue from 'vue'
import Vuex, { ActionContext, ActionTree, MutationTree } from 'vuex'
import { getModule } from 'vuex-module-decorators'

Vue.use(Vuex)

export type RootState = {}
const state: RootState = {}
const store = new Vuex.Store<RootState>({
  state,
  actions: {},
  mutations: {},
  modules: {}
})

export default store
