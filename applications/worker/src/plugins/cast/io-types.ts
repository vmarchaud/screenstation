
import * as t from 'io-ts'

export const ListSinkPayloadIO = t.type({
  worker: t.union([t.undefined, t.string]),
  view: t.string
})

export const CastViewPayloadIO = t.type({
  sink: t.string,
  worker: t.string,
  view: t.string
})
export const StopCastViewPayloadIO = t.type({
  worker: t.string,
  view: t.string
})