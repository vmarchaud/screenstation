<template>
  <v-container fluid ma-0 pa-0>
    <img
      ref="canvas"
      id="canvas"
      @click="onClick"
      src=""
      class="canvas"
    >
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { PayloadType, Packet } from '../../../shared/types/packets'
import { View } from '../store/modules/ViewModule'
import WebsocketModule from '../store/modules/WebsocketModule'

@Component
export default class ControlView extends Vue {
  @Prop()
  // @ts-ignore
  private view: View

  private streaming: boolean = false
  private timeout?: number

  private screenSize: { width: number, height: number } = {
    width: 0,
    height: 0
  }

  mounted () {
    console.log(this.view, 'mounted')
    document.addEventListener('keydown', this.onKeydown)
    document.addEventListener('keyup', this.onKeyup)
    document.addEventListener('keypress', this.onKeypress)

    const timeoutTime = 10 * 60 * 1000

    // start straming
    void WebsocketModule.transaction({
      input: {
        type: PayloadType.START_STREAM_VIEW,
        payload: {
          view: this.view.id,
          worker: this.view.worker,
          timeout: timeoutTime
        }
      },
      callback: (packet: Packet) => {
        const payload = packet.payload as { data: string, metadata: { [key: string]: number}}
        this.screenSize.width = payload.metadata.deviceWidth
        this.screenSize.height = payload.metadata.deviceHeight
        const canvas = document.getElementById('canvas')
        if (canvas === null) return
        canvas.setAttribute('src', `data:image/png;base64,${payload.data}`)
      }
    })

    this.timeout = setTimeout(() => {
      return this.$router.push('home')
    }, timeoutTime) as unknown as number
    this.streaming = true
    console.log(this.view, 'streaming')
  }

  beforeDestroy () {
    document.removeEventListener('keydown', this.onKeydown)
    document.removeEventListener('keyup', this.onKeyup)
    document.removeEventListener('keypress', this.onKeypress)

    void WebsocketModule.send({
      type: PayloadType.STOP_STREAM_VIEW,
      payload: {
        view: this.view.id,
        worker: this.view.worker
      }
    })
    clearTimeout(this.timeout)
  }

  onClick (event: MouseEvent) {
    if (this.streaming === false) return

    const canvas = this.$refs.canvas as HTMLImageElement
    const imgPosition = {
      x: event.offsetX,
      y: event.offsetY
    }
    const params = {
      x: this.screenSize.width / canvas.clientWidth * imgPosition.x,
      y: this.screenSize.height / canvas.clientHeight * imgPosition.y
    }
    void WebsocketModule.send({
      type: PayloadType.EVENT_STREAM_VIEW,
      payload: {
        view: this.view.id,
        worker: this.view.worker,
        event: { type: 'click', params }
      }
    })
  }

  async handleKeyboardEvent (type: string, event: KeyboardEvent) {
    if (this.streaming === false) return
    let text: string = ''

    switch (type) {
      case 'keyup':
        type = 'keyUp'
        break
      case 'keydown':
        type = 'rawKeyDown'
        break
      case 'keypress':
        type = 'char'
        // tslint:disable-next-line
        text = String.fromCharCode(event.keyCode)
        break
      default:
        throw new Error('Unknown type of event.')
    }

    let modifiers = 0
    // specific case to handle pasting content
    if (event.ctrlKey === true && event.key === 'v' && type === 'keyup') {
      try {
        const text = await navigator.clipboard.readText()
        if (text.length > 0) {
          void WebsocketModule.send({
            type: PayloadType.EVENT_STREAM_VIEW,
            payload: {
              view: this.view.id,
              worker: this.view.worker,
              event: {
                type: 'paste',
                params: { text }
              }
            }
          })
          return
        }
      } catch (err) {
        // do nothing
      }
    }
    if (event.shiftKey) modifiers += 8
    if (event.altKey) modifiers += 1
    if (event.ctrlKey) modifiers += 2
    if (event.metaKey) modifiers += 4
    const params = {
      // tslint:disable-next-line
      windowsVirtualKeyCode: event.keyCode,
      modifiers,
      type,
      text
    }
    void WebsocketModule.send({
      type: PayloadType.EVENT_STREAM_VIEW,
      payload: {
        view: this.view.id,
        worker: this.view.worker,
        event: { type: 'keypress', params }
      }
    })
    if (modifiers > 0) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  onKeydown (event: KeyboardEvent) {
    return this.handleKeyboardEvent('keydown', event)
  }

  onKeyup (event: KeyboardEvent) {
    return this.handleKeyboardEvent('keyup', event)
  }

  onKeypress (event: KeyboardEvent) {
    return this.handleKeyboardEvent('keypress', event)
  }
}
</script>

<style scoped lang="scss">
.canvas {
  max-width: -webkit-fill-available;
}
.v-btn:before {
    background-color: transparent;
}
</style>
