<template>
  <v-dialog max-width="600px" :value="isOpen" v-on:click:outside="isOpen = false">
    <v-card>
      <v-form @v-on:submit="save()">
        <v-card-title>
          <span class="headline">Select a screen to create the view in</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-select
                class="ma-5"
                v-model="selectedWorker"
                required
                label="Available screens"
                :items="workers"
                outlined
                max="120"
              ></v-select>
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
            :disabled="selectedWorker === null"
          >Create</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import ViewModule, { View } from '../store/modules/ViewModule'
import WorkerModule from '../store/modules/WorkerModule'

@Component
export default class CreateView extends Vue {
  public selectedWorker: string | null = null
  public isOpen: boolean = false

  public get workers () {
    return WorkerModule.workers.map(worker => worker.name)
  }

  mounted () {
    this.$root.$on('onCreateView', () => {
      this.selectedWorker = this.workers[0]
      this.isOpen = true
    })
  }

  async close () {
    this.isOpen = false
  }
  async save () {
    this.isOpen = false
    const worker = WorkerModule.workers.find(worker => worker.name === this.selectedWorker)
    if (worker === undefined) throw new Error('Cant happen')
    await ViewModule.createView(worker.id)
  }
}
</script>>