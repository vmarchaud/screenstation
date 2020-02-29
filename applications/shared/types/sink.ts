import * as t from 'io-ts'

export const SinkIO = t.type({
  session: t.union([ t.undefined, t.string ]),
  id: t.string,
  name: t.string,
  type: t.keyof({
    CHROMECAST: null
  })
})

export type ChromecastSink = t.TypeOf<typeof ChromecastSinkIO>
export const ChromecastSinkIO = SinkIO

export type Sink = t.TypeOf<typeof SinkIO>