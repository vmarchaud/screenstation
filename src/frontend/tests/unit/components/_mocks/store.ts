import { CounterStore } from '@/store/interfaces/CounterStore';
import { RootState } from '@/store/interfaces/RootState';
import CounterModule from '@/store/modules/CounterModule';
import { isNotRegistered } from '@/store/utils';
import { LoggerFactory } from '@mmit/logging';
import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { getModule } from 'vuex-module-decorators';

export const localVue = createLocalVue();

localVue.use(Vuex);

// LoggerFactory.defaultLevel = LogLevel.DEBUG;

const state: RootState = {
    loaded: true,

    counterStore: (): CounterStore => {
        const logger = LoggerFactory.getLogger('test.unit.components._mocks.store.counterStore');

        if (isNotRegistered(CounterModule.NAME, store)) {
            logger.debug('Register jobModule...');
            // registerModule src: http://bit.ly/34uLFBk
            store.registerModule(CounterModule.NAME, CounterModule);
        }
        // getModule src: http://bit.ly/2CfpLWQ
        return getModule(CounterModule, store);
    },
};

export const store = new Vuex.Store<RootState>({
    state,
    // modules: {
    //     gameModule,
    // },
});
