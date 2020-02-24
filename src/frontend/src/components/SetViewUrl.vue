<template>
  <v-dialog max-width="600px" :value="isSettingUrl" v-on:click:outside="isSettingUrl = false">
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
  @Prop()
  // @ts-ignore
  public view: View

  public inputValue: string = ''
  public isSettingUrl: boolean = false

  mounted () {
    this.inputValue = this.view.currentURL ?? ''
    this.$root.$on('onSetViewUrl', (viewId: string) => {
      if (viewId !== this.view.id) return
      this.isSettingUrl = true
    })
  }

  async setUrl () {
    await ViewModule.setUrl({ view: this.view, url: this.inputValue })
    this.isSettingUrl = false
  }
}
</script>>