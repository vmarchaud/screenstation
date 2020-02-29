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
          <v-btn
            color="blue"
            text
            v-show="view.capabilities.refresh"
            @click="openSetRefresh(view)"
          >
            Set refresh interval
          </v-btn>
          <v-btn
            color="blue"
            text
            v-show="view.capabilities.cast"
            @click="openSelectSink(view)"
          >
            Cast view
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
      </v-card>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ViewModule, { View } from '../store/modules/ViewModule'
import SetViewUrl from './SetViewUrl.vue'
import SetRefreshUrl from './SetRefreshView.vue'
import SelectSinkView from './SelectSinkView.vue'

@Component({ components: { SetViewUrl, SetRefreshUrl, SelectSinkView } })
export default class ViewList extends Vue {

  public get views () {
    return ViewModule.views
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
}
</script>

<style scoped lang="scss">
.v-btn:before {
    background-color: transparent;
}
</style>
