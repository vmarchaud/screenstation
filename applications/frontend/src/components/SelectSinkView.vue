<template>
  <v-dialog max-width="600px" :value="isOpen" v-on:click:outside="isOpen = false">
    <v-card>
      <v-form @v-on:submit="save()">
        <v-card-title>
          <span class="headline">Select a device to cast to</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-select
                class="ma-5"
                v-model="selectedSink"
                required
                label="Available device"
                :items="sinks"
                outlined
                max="120"
              ></v-select>
            </v-row>
            <v-row class="pl-5">
              (Set to 'none' to disable)
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary darken-1"
            text
            @click="save()"
            :disabled="selectedSink === view.currentURL"
          >Set</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import ViewModule, { View } from '../store/modules/ViewModule'

@Component
export default class SetViewUrl extends Vue {
  // @ts-ignore
  public view: View = { sinks: [] }

  public selectedSink: string = 'none'
  public isOpen: boolean = false

  public get sinks () {
    return ['none'].concat(this.view.sinks.map(sink => sink.name))
  }

  mounted () {
    this.$root.$on('onSelectSink', (view: View) => {
      this.view = view
      this.selectedSink = this.view.currentSink ?? 'none'
      void ViewModule.fetchViewSinks(this.view)
      this.isOpen = true
    })
  }

  async save () {
    const sink = this.view.sinks.find(sink => sink.name === this.selectedSink)
    if (sink === undefined) {
      await ViewModule.stopSinkForView({ view: this.view })
    } else {
      await ViewModule.setSinkForView({ sink, view: this.view })
    }
    this.isOpen = false
  }
}
</script>>