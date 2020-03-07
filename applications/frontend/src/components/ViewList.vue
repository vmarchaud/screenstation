<template>
    <v-container fluid class="pr-0">
        <v-row class="mb-10">
          <v-col>
            <v-text-field
              hide-details
              label="Search for a specific view by its url"
              prepend-icon="search"
              single-line
            ></v-text-field>
          </v-col>
          <v-col>
             <v-btn circle color="primary">
              <v-icon>mdi-plus</v-icon>
              Add a new view
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
            <v-card
            v-for="view in views"
            v-bind:key="view.worker + view.name"
            class="mx-auto"
            max-width="800"
          >
            <v-card-title>
              <v-col cols=10 class="pa-0" style="text-align: initial;">
                {{ view.currentURL.substring(0, 50) }}
              </v-col>
              <v-col cols=2 class="pa-0">
                <!-- Button to cast a view -->
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-icon
                      v-on="on"
                      class="pa-2"
                      :color="view.currentSink !== undefined ? 'primary' : ''"
                      @click="openSelectSink(view)"
                    >{{ view.currentSink !== undefined ? 'mdi-cast-connected' : 'mdi-cast'}}</v-icon>
                  </template>
                  <span>Currently casting to {{ getCurrentSinkName(view) }}</span>
                </v-tooltip>
                <!-- Button to set view as active -->
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-icon
                      v-on="on"
                      class="pa-2"
                      :color="view.isSelected ? 'primary' : ''"
                      @click="openSetActive(view)"
                    >{{ view.isSelected ? 'mdi-television-play' : 'mdi-television'}}</v-icon>
                  </template>
                  <span>Currently {{ view.isSelected ? 'shown' : 'hidden'}}</span>
                </v-tooltip>
              </v-col>
            </v-card-title>
            <v-divider></v-divider>
            <v-img
              class="white--text align-end"
              :src="view.screenshot"
            >
              
            </v-img>

            <v-card-actions>
              <v-btn
                color="orange"
                text
                @click="openSetURL(view)"
              >
                Set URL
              </v-btn>
              <v-btn
                color="blue"
                text
                v-show="view.capabilities.refresh"
                @click="openSetRefresh(view)"
              >
                Set refresh interval
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
            <SetViewUrl :view="view" ></SetViewUrl>
            <SetRefreshUrl v-show="view.capabilities.refresh" :view="view" ></SetRefreshUrl>
            <SelectSinkView v-show="view.capabilities.cast" :view="view" ></SelectSinkView>
            <SetViewAsActive :view="view" ></SetViewAsActive>
          </v-card>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ViewModule, { View } from '../store/modules/ViewModule'
import SetViewUrl from './SetViewUrl.vue'
import SetRefreshUrl from './SetRefreshView.vue'
import SelectSinkView from './SelectSinkView.vue'
import SetViewAsActive from './SetViewAsActive.vue'

@Component({ components: { SetViewUrl, SetRefreshUrl, SelectSinkView, SetViewAsActive } })
export default class ViewList extends Vue {

  public get views () {
    return ViewModule.views
  }

  getCurrentSinkName (view: View) {
    if (view.currentSink === undefined) return 'nothing'
    const sink = view.sinks.find(sink => sink.name === view.currentSink)
    if (sink === undefined) return 'nothing'
    return sink.name
  }

  async openSetURL (view: View) {
    this.$root.$emit('onSetViewUrl', view.id)
  }

  async openSetRefresh (view: View) {
    this.$root.$emit('onSetRefresh', view.id)
  }

  async openSelectSink (view: View) {
    this.$root.$emit('onSelectSink', view.id)
  }

  async openSetActive (view: View) {
    if (view.isSelected === true) return
    this.$root.$emit('onSetViewActive', view.id)
  }
}
</script>

<style scoped lang="scss">
.v-btn:before {
    background-color: transparent;
}
</style>
