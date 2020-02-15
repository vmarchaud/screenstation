import HelloWorld from '@/components/HelloWorld.vue';
import { mount, Wrapper } from '@vue/test-utils';
import { localVue, store } from './_mocks/store';

// import Vue from 'vue';
// import { VueConstructor } from 'vue/types/vue';
// import Vuetify from 'vuetify';

// Vue.config.productionTip = false;
// Vue.use(Vuetify);

type Tick = () => Promise<void>;

const waitFor = async (ms: number, tick?: Tick): Promise<void> => {
    const nrOfSteps = 10;
    const steps = ms / nrOfSteps;

    let counter = 0;
    let id: NodeJS.Timeout;

    await new Promise((resolve): void => {
        id = setInterval((): void => {
            if (tick) {
                tick();
            }
            counter++;
            if (counter > nrOfSteps) {
                clearInterval(id);
                resolve();
            }
        }, steps);
    });
};

describe('HelloWorld.vue', () => {
    // let localVue: VueConstructor<HelloWorld>;
    // let vuetify: IVuetify;

    const startValue = 15;
    const textForCounter = 'Counter:';

    const msg = 'new message';
    let wrapper: Wrapper<HelloWorld> | undefined;

    // beforeEach(() => {
    // });

    afterEach(() => {
        if (wrapper) {
            wrapper.destroy();
            wrapper = undefined;
        }
    });

    test('renders props.msg when passed', () => {
        wrapper = mount(HelloWorld, { localVue, store, propsData: { msg } });

        expect(wrapper.text()).toMatch(msg);
        expect(wrapper.isVueInstance()).toBeTruthy();
    });

    test('Button click', async () => {
        wrapper = mount(HelloWorld, { localVue, store, propsData: { msg } });

        expect(wrapper.text()).toMatch(msg);

        // HTML-Out
        // console.log(wrapper.html());

        const foundToggleBtn = wrapper.findAll('.v-btn.alert');
        expect(foundToggleBtn.exists()).toBeTrue();
        expect(foundToggleBtn.length).toBe(1);

        // v-col rendert mit 'col'!
        const foundColVuetify = wrapper.findAll('.col:nth-child(2)');
        expect(foundColVuetify.exists()).toBeTrue();
        expect(foundColVuetify.length).toBe(1);

        // Alert-Box ist by default visible
        const foundAlert = wrapper.find('.v-alert');
        expect(foundAlert.exists()).toBeTrue();
        expect(foundAlert.isVisible()).toBeTrue();

        expect(foundToggleBtn).not.toBeNull();

        // Data-Property steht per default auf TRUE
        expect(wrapper.vm.$data.alert).toBeTrue();
        foundToggleBtn.trigger('click');

        // Wait for the Transition to be done...
        await waitFor(100, wrapper?.vm.$nextTick);

        expect(foundAlert.isVisible()).toBeFalse();

        // Durch den click hat sich "alert" auf FALSE gedreht
        expect(wrapper.vm.$data.alert).toBeFalse();
    });

    test('Loaded-State (Store) is by default "true"', async () => {
        await store.state.counterStore().decrement(1);

        wrapper = mount(HelloWorld, { localVue, store, propsData: { msg } });

        const foundCounter = wrapper.find('.counter');
        expect(foundCounter.exists()).toBeTrue();

        expect(store.state.counterStore().count).toBe(startValue - 1);
        expect(foundCounter.text()).toBe(`${textForCounter} ${startValue - 1}`);

        // Set to init state
        await store.state.counterStore().increment(1);
    });

    test('Test Button-click', async () => {
        wrapper = mount(HelloWorld, { localVue, store, propsData: { msg } });

        const foundPlusButton = wrapper.find('.plus');

        expect(foundPlusButton.exists()).toBeTrue();

        expect(store.state.counterStore().count).toBe(startValue);

        foundPlusButton.trigger('click');

        // increment in store is async - so we wait a bit...
        await waitFor(100);

        // Store has changed!
        expect(store.state.counterStore().count).toBe(startValue + 1);

        // Re-Render
        wrapper = mount(HelloWorld, { localVue, store, propsData: { msg } });

        const foundCounter = wrapper.find('.counter');
        expect(foundCounter.exists()).toBeTrue();

        expect(foundCounter.text()).toBe(`${textForCounter} ${startValue + 1}`);

        // Set to init state
        await store.state.counterStore().decrement(1);
        expect(store.state.counterStore().count).toBe(startValue);
    });
});
