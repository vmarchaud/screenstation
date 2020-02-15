<template>
    <v-app id="app" class="layout--off" color="gray-lighten2">
        <v-app-bar app color="indigo" dark clipped-left>
            <router-link to="/" class="to-home white--text">
                <v-toolbar-title class="title">ScreenStation</v-toolbar-title>
            </router-link>
            <AppHeader></AppHeader>
        </v-app-bar>
        <v-content>
            <router-view />
        </v-content>
        <AppFooter></AppFooter>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'

@Component({ components: { AppFooter, AppHeader } })
export default class App extends Vue {}
</script>

<style lang="scss">
.v-app-bar {
    a.to-home {
        text-decoration: none;
    }
}
</style>
