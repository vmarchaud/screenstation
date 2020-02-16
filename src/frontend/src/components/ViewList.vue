<template>
    <v-container fluid d-flex class="pr-0">
      <v-card
        v-for="view in views"
        v-bind:key="view.worker + view.name"
        class="mx-auto"
        max-width="800"
      >

        <v-img
          class="white--text align-end"
          :src="view.screenshot"
        >
          <v-card-title>{{ view.currentURL }}</v-card-title>
        </v-img>

        <v-card-subtitle class="pb-0">{{ view.currentURL}}- {{ view.worker }}</v-card-subtitle>

        <v-card-actions>
          <v-btn
            color="orange"
            text
            @click="openSetURL(view)"
          >
            Set URL
          </v-btn>
          <router-link :to="`${view.worker}/${view.id}/control`">
             <v-btn
              color="orange"
              text
            >
              Control
            </v-btn>
          </router-link>
        </v-card-actions>
      </v-card>
      <v-dialog max-width="600px" :value="isSettingUrl" v-on:click:outside="isSettingUrl = false">
        <v-card>
          <v-form @submit="setUrlForActiveView()">
            <v-card-title>
              <span class="headline">Set URL on this view</span>
            </v-card-title>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-text-field
                    class="ma-5"
                    v-model="currentURL"
                    required
                  ></v-text-field>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary darken-1"
                text
                :disabled="selectedView && currentURL === selectedView.currentURL"
                @click="setUrlForActiveView()"
              >Set</v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-dialog>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ViewModule, { View } from '../store/modules/ViewModule'

@Component
export default class ViewList extends Vue {

  public isSettingUrl: boolean = false
  public selectedView: View | null = null
  public currentURL: string = ''

  public get views () {
    return ViewModule.views
  }

  async openSetURL (view: View) {
    this.selectedView = view
    this.currentURL = view.currentURL ?? ''
    this.isSettingUrl = true
  }

  async setUrlForActiveView () {
    const view = this.selectedView
    if (view === null || this.currentURL === view.currentURL) return
    await ViewModule.setUrl({ view, url: this.currentURL })
    this.currentURL = ''
    this.selectedView = null
    this.isSettingUrl = false
  }
}
</script>

<style scoped lang="scss">
.v-btn:before {
    background-color: transparent;
}
</style>
