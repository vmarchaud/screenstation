import HelloWorld from '@/components/HelloWorld.vue';
import { shallowMount, Wrapper } from '@vue/test-utils';
import { localVue, store } from './_mocks/store';
// import Vue from 'vue';
// import { VueConstructor } from 'vue/types/vue';
// import Vuetify from 'vuetify';

// Vue.config.productionTip = false;
// Vue.use(Vuetify);

describe('HelloWorld.vue', () => {
    let wrapper: Wrapper<HelloWorld> | undefined;

    afterEach(() => {
        if (wrapper) {
            wrapper.destroy();
            wrapper = undefined;
        }
    });

    test('renders props.msg when passed', () => {
        const msg = 'new message';

        // shallowMount rendert keine Child-Komponenten
        wrapper = shallowMount(HelloWorld, {
            localVue,
            store,
            // vuetify,
            propsData: { msg },
        });

        expect(wrapper.text()).toMatch(msg);
        expect(wrapper.isVueInstance()).toBeTruthy();
    });

    test('simulate v-btn', () => {
        const msg = 'new message';

        // shallowMount rendert keine Child-Komponenten
        wrapper = shallowMount(HelloWorld, {
            localVue,
            store,
            stubs: {
                'v-alert': {
                    template: '<div class="v-alert">ALTER-Text</div>',
                },
            },
            propsData: { msg },
        });

        expect(wrapper.text()).toMatch(msg);
        expect(wrapper.isVueInstance()).toBeTruthy();

        expect(wrapper.find('.v-alert').exists()).toBeTrue();
    });
});
