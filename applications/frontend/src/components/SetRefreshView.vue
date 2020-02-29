<template>
  <v-dialog max-width="600px" :value="isOpen" v-on:click:outside="isOpen = false">
    <v-card>
      <v-form @v-on:submit="save()">
        <v-card-title>
          <span class="headline">Set a refresh interval on this view</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-slider
                class="ma-5"
                :label="inputValue + ' seconds'"
                v-model="inputValue"
                required
                max="120"
              ></v-slider>
            </v-row>
            <v-row class="pl-5">
              (Set to 0 to disable)
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary darken-1"
            text
            @click="save()"
            :disabled="inputValue === view.currentURL"
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
  @Prop()
  // @ts-ignore
  public view: View

  public inputValue: number = 0
  public isOpen: boolean = false

  mounted () {
    const refreshEvery = this.view.refresh?.refreshEvery
    this.inputValue = refreshEvery ? refreshEvery / 1000 : 0
    this.$root.$on('onSetRefresh', (viewId: string) => {
      if (viewId !== this.view.id) return
      this.isOpen = true
    })
  }

  async save () {
    await ViewModule.setRefreshOnView({ refresh: this.inputValue, view: this.view })
    this.isOpen = false
  }
}
</script>>