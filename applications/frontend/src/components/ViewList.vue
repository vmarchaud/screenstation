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
             <v-btn @click="openCreateView" circle color="primary">
              <v-icon>mdi-plus</v-icon>
              Add a new view
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
            <v-card
            v-for="view in views"
            v-bind:key="view.worker + view.id"
            class="mx-auto mt-10"
            min-width="800"
          >
            <v-card-title>
              <v-col cols=9 class="pa-0" style="text-align: initial;">
                {{ view.currentURL.substring(0, 50) }}
              </v-col>
              <v-col cols=3 class="pa-0">
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
                  <span>Currently {{ view.isSelected ? 'shown' : 'hidden'}} on {{ getWorkerForView(view) }} </span>
                </v-tooltip>
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-icon
                      v-on="on"
                      class="pa-2"
                      @click="reloadView(view)"
                    >mdi-restart</v-icon>
                  </template>
                  <span>Reload this view</span>
                </v-tooltip>
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-icon
                      v-on="on"
                      class="pa-2"
                      color="red dark"
                      @click="deleteView(view)"
                    >close</v-icon>
                  </template>
                  <span>Remove this view</span>
                </v-tooltip>
              </v-col>
            </v-card-title>
            <v-divider></v-divider>
            <v-img
              v-if="view.screenshot !== undefined"
              class="white--text align-end"
              :src="view.screenshot"
              min-width="500px"
              max-width="800px"
            >
            <v-divider></v-divider>
              
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
          </v-card>
        </v-row>
      <SetViewUrl></SetViewUrl>
      <SetRefreshUrl></SetRefreshUrl>
      <SelectSinkView></SelectSinkView>
      <SetViewAsActive></SetViewAsActive>
      <CreateView></CreateView>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ViewModule, { View } from '../store/modules/ViewModule'
import WorkerModule from '../store/modules/WorkerModule'
import SetViewUrl from './SetViewUrl.vue'
import SetRefreshUrl from './SetRefreshView.vue'
import SelectSinkView from './SelectSinkView.vue'
import SetViewAsActive from './SetViewAsActive.vue'
import CreateView from './CreateView.vue'

@Component({ components: { SetViewUrl, SetRefreshUrl, SelectSinkView, SetViewAsActive, CreateView } })
export default class ViewList extends Vue {

  public get views () {
    return ViewModule.views
  }

  getCurrentSinkName (view: View) {
    if (view.currentSink === undefined) return 'nothing'
    const sink = view.sinks.find(sink => sink.id === view.currentSink)
    if (sink === undefined) return 'nothing'
    return sink.name
  }

  getWorkerForView (view: View) {
    const worker = WorkerModule.workers.find(worker => worker.id === view.worker)
    return worker ? worker.name : '???'
  }

  async openSetURL (view: View) {
    this.$root.$emit('onSetViewUrl', view)
  }

  async openSetRefresh (view: View) {
    this.$root.$emit('onSetRefresh', view)
  }

  async openSelectSink (view: View) {
    this.$root.$emit('onSelectSink', view)
  }

  async openSetActive (view: View) {
    if (view.isSelected === true) return
    this.$root.$emit('onSetViewActive', view)
  }

  async deleteView (view: View) {
    await ViewModule.deleteView(view)
  }

  async reloadView (view: View) {
    await ViewModule.reloadView(view)
  }

  async openCreateView () {
    this.$root.$emit('onCreateView')
  }
}
</script>

<style scoped lang="scss">
.v-btn:before {
    background-color: transparent;
}
</style>
