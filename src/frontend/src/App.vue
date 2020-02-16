<template>
  <v-app id="app" color="gray-lighten2">
    <Loader :value="loading" message="Connecting to Screenstation .."></Loader>
    <v-app-bar app color="primary" dark clipped-left>
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
import Loader from './components/Loader.vue'

import InitModule from './store/modules/InitModule'

@Component({ components: { AppFooter, AppHeader, Loader } })
export default class App extends Vue {

  public get loading () {
    return InitModule.isLoaded === false
  }

  mounted (): void {
    void InitModule.init()
  }
}
</script>

<style lang="scss">
.v-app-bar {
    a.to-home {
        text-decoration: none;
    }
}

.v-content {
  overflow-y: auto
}

.dialog.centered-dialog,
  .v-dialog.centered-dialog
 {
    background: #282c2dad;
    box-shadow: none;
    border-radius: 6px;
    width: auto;
    color: whitesmoke;
  }
</style>
