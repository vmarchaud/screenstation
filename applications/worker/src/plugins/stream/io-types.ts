import * as t from 'io-ts'

export const StartStreamPayLoadIO = t.type({
  worker: t.string,
  view: t.string,
  timeout: t.number
})

export const StreamEventPayloadIO = t.type({
  worker: t.string,
  view: t.string,
  event: t.type({
    type: t.union([
      t.literal('click'),
      t.literal('keypress'),
      t.literal('paste')
    ]),
    params: t.any
  })
})

export const StopStreamViewPayLoadIO = t.type({
  worker: t.string,
  view: t.string
})