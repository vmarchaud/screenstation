<template>
    <v-container fluid d-flex class="pr-0">
      <v-dialog max-width="600px">
        <template v-slot:activator="{ on }">
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
                v-on="on"
                @click="openSetURL(view)"
              >
                Set URL
              </v-btn>

              <v-btn
                color="orange"
                text
              >
                Control
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
        <v-card>
          <v-card-title>
            <span class="headline">Set currentURL</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field label="Url" required></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary darken-1" text @click="setUrlForActiveView()">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ViewModule, { View } from '../store/modules/ViewModule'

@Component
export default class ViewList extends Vue {

  private _isSettingUrl: boolean = true
  private _selectedView: View | null = null
  public currentURL?: string

  public get isSettingUrl () {
    return this._isSettingUrl
  }
  public get views () {
    return ViewModule.views
  }

  async openSetURL (view: View) {
    console.log(view)
    this._isSettingUrl = true
    this._selectedView = view
    this.currentURL = view.currentURL
  }

  async setUrlForActiveView () {
    const view = this._selectedView
    if (view === null || this.currentURL === undefined) return
    await ViewModule.setUrl(this.currentURL, view)
    this.currentURL = undefined
    this._selectedView = null
    this._isSettingUrl = false
  }
}
</script>

<style scoped lang="scss">
.v-btn:before {
    background-color: transparent;
}
</style>
