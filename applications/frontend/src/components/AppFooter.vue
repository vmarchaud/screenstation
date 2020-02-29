<template>
    <v-footer fixed dark>
        <v-row class="mb-6" no-gutters>
            <v-col class="version_block align-end">
                <span class="version">Version {{ version }}</span>
                <span class="separator mx-1">/</span>
                <span class="published">{{ devmode }}</span>
            </v-col>
        </v-row>
    </v-footer>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class AppFooter extends Vue {
  public get (): string {
    return process.env.VUE_APP_PUBLISHED || '<process.env.VUE_APP_PUBLISHED = undefined>'
  }

  public get version (): string {
    return process.env.VUE_APP_VERSION || '<process.env.VUE_APP_VERSION = undefined>'
  }

  public get devmode (): string {
    const devMode = process.env.VUE_APP_DEV_MODE || '<process.env.VUE_APP_DEV_MODE = undefined>'
    return devMode === 'true' ? 'development' : 'production'
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
