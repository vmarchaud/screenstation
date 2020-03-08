
import * as t from 'io-ts'

export const CreateViewPayloadIO = t.type({
  name: t.union([ t.undefined, t.string ]),
  worker: t.union([t.undefined, t.string]),
  url: t.union([ t.undefined, t.string ])
})

export const ListViewPayloadIO = t.type({
  worker: t.union([t.undefined, t.string])
})

export const DeleteViewPayloadIO = t.type({
  worker: t.union([t.undefined, t.string]),
  view: t.string
})

export const GetViewPayloadIO = t.type({
  worker: t.string,
  view: t.string
})

export const SelectViewPayloadIO = t.type({
  worker: t.string,
  view: t.string
})

export const SetViewUrlPayloadIO = t.type({
  worker: t.string,
  view: t.string,
  url: t.string
})