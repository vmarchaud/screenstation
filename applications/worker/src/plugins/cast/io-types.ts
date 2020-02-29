
import * as t from 'io-ts'
import { SinkIO } from '../../../../shared/types/sink'

export const ListSinkPayloadIO = t.type({
  sinks: t.array(SinkIO),
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