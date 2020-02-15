import { CounterStore } from '@/store/interfaces/CounterStore';
import { RootState } from '@/store/interfaces/RootState';
import CounterModule from '@/store/modules/CounterModule';
import { isNotRegistered } from '@/store/utils';
import Vue from 'vue';
import Vuex, { ActionContext, ActionTree, MutationTree } from 'vuex';
import { getModule } from 'vuex-module-decorators';

// import gameModule from './modules/GameModule';

Vue.use(Vuex);

const state: RootState = {
    loaded: false,

    counterStore: (): CounterStore => {
        if (isNotRegistered(CounterModule.NAME, store)) {
            // console.log('Register jobModule...');
            // registerModule src: http://bit.ly/34uLFBk
            store.registerModule(CounterModule.NAME, CounterModule);
        }
        // getModule src: http://bit.ly/2CfpLWQ
        return getModule(CounterModule, store);
    },
};

/**
 * Actions can be asynchronous.
 *
 * Make it a practice to never commit your Mutations directly.
 * Always use Actions to commit your mutations
 *
 *      this.$store.dispatch('readyState');
 */
const actions: ActionTree<RootState, RootState> = {
    /**
     * main.ts (app) fires "readyState" if mounted
     *
     * @param context
     * @param payload
     */
    async readyState(context: ActionContext<RootState, RootState>, payload: undefined): Promise<void> {
        // Simulate loading time...
        setTimeout(() => {
            context.commit('readyState', true);
        }, 1500);
    },
};

/**
 * Mutations are synchronous
 *
 *      context.commit('readyState', loadState);
 */
const mutations: MutationTree<RootState> = {
    readyState(status: RootState, payload): void {
        // logger.info(`readyState - Mutation`);
        status.loaded = true;
    },
};

const store = new Vuex.Store<RootState>({
    state,
    actions,
    mutations,
    // modules: {
    //     gameModule,
    // },
});

export default store;
