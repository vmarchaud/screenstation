import * as t from 'io-ts'

export const SinkIO = t.type({
  id: t.string,
  name: t.string,
  type: t.keyof({
    CHROMECAST: null
  })
})

export type ChromecastSink = t.TypeOf<typeof ChromecastSinkIO>
export const ChromecastSinkIO = SinkIO

export type Sink = t.TypeOf<typeof SinkIO>