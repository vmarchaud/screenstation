
import * as t from 'io-ts'

export const SetRefreshPayloadIO = t.type({
  worker: t.string,
  view: t.string,
  refreshEvery: t.number
})

export const GetRefreshPayloadIO = t.type({
  worker: t.string,
  view: t.string
})