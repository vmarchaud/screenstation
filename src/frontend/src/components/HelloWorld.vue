<template>
    <div>
        <h1>{{ msg }}</h1>
        <p>
            For a guide and recipes on how to configure / customize this project,
            <br />
            check out the
            <a href="https://cli.vuejs.org" target="_blank" rel="noopener">vue-cli documentation</a>
            .
        </p>
        <v-row class="m-row" no-gutters align="start">
            <v-col cols="6">
                <h3>Installed CLI Plugins /</h3>
                <ul>
                    <li>
                        <a
                            href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-typescript"
                            target="_blank"
                            rel="noopener"
                        >
                            typescript
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-unit-jest"
                            target="_blank"
                            rel="noopener"
                        >
                            unit-jest
                        </a>
                    </li>
                </ul>
                <h3>Essential Links</h3>
                <ul>
                    <li>
                        <a href="https://vuejs.org" target="_blank" rel="noopener">Core Docs</a>
                    </li>
                    <li>
                        <a href="https://forum.vuejs.org" target="_blank" rel="noopener">Forum</a>
                    </li>
                    <li>
                        <a href="https://chat.vuejs.org" target="_blank" rel="noopener">Community Chat</a>
                    </li>
                    <li>
                        <a href="https://twitter.com/vuejs" target="_blank" rel="noopener">Twitter</a>
                    </li>
                    <li>
                        <a href="https://news.vuejs.org" target="_blank" rel="noopener">News</a>
                    </li>
                </ul>
                <h3>Ecosystem</h3>
                <ul>
                    <li>
                        <a href="https://router.vuejs.org" target="_blank" rel="noopener">vue-router</a>
                    </li>
                    <li>
                        <a href="https://vuex.vuejs.org" target="_blank" rel="noopener">vuex</a>
                    </li>
                    <li>
                        <a href="https://github.com/vuejs/vue-devtools#vue-devtools" target="_blank" rel="noopener">
                            vue-devtools
                        </a>
                    </li>
                    <li>
                        <a href="https://vue-loader.vuejs.org" target="_blank" rel="noopener">vue-loader</a>
                    </li>
                    <li>
                        <a href="https://github.com/vuejs/awesome-vue" target="_blank" rel="noopener">awesome-vue</a>
                    </li>
                </ul>
            </v-col>
            <v-col>
                <h3 class="from-store">
                    From Store
                    <v-btn class="plus" text icon color="green" @click="increment">
                        <v-icon>mdi-plus-circle-outline</v-icon>
                    </v-btn>
                    <v-btn class="minus" text icon color="red" @click="store.decrement(1)">
                        <v-icon>mdi-minus-circle-outline</v-icon>
                    </v-btn>
                </h3>
                <ul>
                    <li class="counter">Counter: {{ store.count }}</li>
                </ul>
                <h3>Vuetify</h3>
                <div class="purple darken-2 text-center round">
                    <span class="white--text">Lorem ipsum</span>
                </div>
                <div>
                    <v-btn class="my-2 alert" color="primary" @click="alert = !alert">
                        Toggle
                    </v-btn>
                </div>
                <v-alert :value="alert" color="pink" dark border="top" icon="mdi-home" transition="scale-transition">
                    Phasellus tempus. Fusce ac felis sit amet ligula pharetra condimentum. In dui magna, posuere eget,
                    vestibulum et, tempor auctor, justo. Pellentesque posuere. Curabitur ligula sapien, tincidunt non,
                    euismod vitae, posuere imperdiet, leo. Phasellus nec sem in justo pellentesque facilisis. Phasellus
                    magna. Cras risus ipsum, faucibus ut, ullamcorper id, varius ac, leo. In hac habitasse platea
                    dictumst. Praesent turpis.
                </v-alert>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { CounterStore } from '@/store/interfaces/CounterStore';
import { RootState } from '@/store/interfaces/RootState';
import { LoggerFactory } from '@mmit/logging';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class HelloWorld extends Vue {
    private readonly logger = LoggerFactory.getLogger('vuetify-ts-starter.components.HelloWorld');

    @Prop() private msg!: string;

    public alert: boolean = true;

    public increment(): void {
        this.logger.debug('Clicked!');
        this.store.increment(1);
    }

    // noinspection JSUnusedLocalSymbols
    private get store(): CounterStore {
        return (this.$store.state as RootState).counterStore();
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
    margin: 40px 0 0;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    display: inline-block;
    margin: 0 10px;
}

a {
    color: #42b983;
}
.from-store .v-btn--icon.v-size--default {
    width: auto;
}
</style>
