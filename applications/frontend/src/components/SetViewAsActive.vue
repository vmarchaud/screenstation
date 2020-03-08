<template>
  <v-dialog max-width="600px" :value="isOpen" v-on:click:outside="isOpen = false">
    <v-card>
      <v-form @v-on:submit="save()">
        <v-card-title>
          <span class="headline">Set view as active</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row class="pa-5">
              You are able to set {{ view.currentURL }} as the view on the screen, are you sure ?
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            @click="close()"
          >Cancel</v-btn>
          <v-btn
            color="primary darken-1"
            text
            @click="save()"
          >Yes, continue</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import ViewModule, { View } from '../store/modules/ViewModule'

@Component
export default class SetViewAsActive extends Vue {

  // @ts-ignore
  public view: View = {}
  public isOpen: boolean = false

  mounted () {
    this.$root.$on('onSetViewActive', (view: View) => {
      this.view = view
      this.isOpen = true
    })
  }

  async save () {
    await ViewModule.setViewAsActive({ view: this.view })
    this.isOpen = false
  }

  async close () {
    this.isOpen = false
  }
}
</script>>