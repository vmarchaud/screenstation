<template>
  <v-dialog max-width="600px" :value="isOpen" v-on:click:outside="isOpen = false">
    <v-card>
      <v-form @v-on:submit="setUrl()">
        <v-card-title>
          <span class="headline">Set URL on this view</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-text-field
                class="ma-5"
                v-model="inputValue"
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
            @click="setUrl()"
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
  public inputValue: string = ''
  public isOpen: boolean = false
  // @ts-ignore
  public view: View = {}

  mounted () {
    this.$root.$on('onSetViewUrl', (view: View) => {
      this.view = view
      this.inputValue = this.view.currentURL ?? ''
      this.isOpen = true
    })
  }

  async setUrl () {
    await ViewModule.setUrl({ view: this.view, url: this.inputValue })
    this.isOpen = false
  }
}
</script>>