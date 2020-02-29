<template>
  <ControlView v-if="view !== null" :view="view"></ControlView>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ControlView from '@/components/ControlView.vue'
import ViewModule, { View } from '../store/modules/ViewModule'

@Component({ components: { ControlView } })
export default class Home extends Vue {

  view: View | null = null

  mounted () {
    const params = this.$route.params
    // tslint:disable-next-line
    if (params.view === undefined || params.worker === undefined) {
      void this.$router.push('home')
      return
    }
    const view = ViewModule.views.find(_view => {
      return _view.worker === params.worker && _view.id === params.view
    })
    if (view === undefined) {
      void this.$router.push('home')
      return
    }
    this.view = view
  }
}
</script>
<style lang="scss"></style>
