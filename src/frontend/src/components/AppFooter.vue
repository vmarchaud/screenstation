<template>
    <v-footer fixed dark>
        <v-row class="mb-6" no-gutters>
            <v-col>
                <v-btn class="mr-3" color="success" small @click="onClickIncrement">+</v-btn>
                <v-btn class="mr-3" color="error" small v-on:click="onClickDecrement">-</v-btn>
                <span class="message" :class="{ loaded: state.loaded }">
                    {{ state.loaded ? 'Loaded!' : 'Loading...' }}
                </span>
                {{ title_inc || title }}
                <span v-if="isEven">(even)</span>
                <span v-else>(odd)</span>
            </v-col>
            <v-col class="version_block align-end">
                <span class="version">Version {{ version }}</span>
                <span class="separator mx-1">/</span>
                <span class="published">{{ published }}</span>
            </v-col>
        </v-row>
    </v-footer>
</template>

<script lang="ts">
import { RootState } from '@/store/interfaces/RootState';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class AppFooter extends Vue {
    @Prop({ default: process.env.VUE_APP_TITLE })
    private title!: string;

    // Component methods can be declared as instance methods
    public onClickIncrement(): void {
        this.state.counterStore().increment(1);
    }

    public onClickDecrement(): void {
        this.$store.dispatch('counterModule/decrement', 1);
    }

    public get title_inc(): string {
        return `${this.title} / ${this.state.counterStore().count}`;
    }

    public get published(): string {
        return process.env.VUE_APP_PUBLISHED || '<process.env.VUE_APP_PUBLISHED = undefined>';
    }

    public get version(): string {
        return process.env.VUE_APP_VERSION || '<process.env.VUE_APP_VERSION = undefined>';
    }

    public get devmode(): boolean {
        const devMode = process.env.VUE_APP_DEV_MODE || '<process.env.VUE_APP_DEV_MODE = undefined>';

        return devMode === 'true';
    }

    public get isEven(): boolean {
        return this.state.counterStore().count % 2 === 0;
    }

    private get state(): RootState {
        return this.$store.state as RootState;
    }
}
</script>

<style scoped lang="scss">
.v-footer--absolute,
.v-footer--fixed {
    z-index: 4;

    .row {
        margin: 0 !important;
        padding: 0;
    }

    .col {
        background-color: inherit;
    }

    .version_block {
        text-align: right;
        font-size: 90%;
    }
    .message {
        color: red;
        margin-right: 0.5em;

        &.loaded {
            color: green;
        }
    }
}
</style>
