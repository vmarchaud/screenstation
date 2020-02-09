
import * as t from 'io-ts'
import { DateIO } from '../utils/io-types'
import { SinkIO } from './sink'
import { ViewIO } from './view'

export enum PayloadType {
  HELLO = 'HELLO',
  SHOW = 'SHOW',
  STOP = 'STOP',
  RESTART = 'RESTART',
  LIST_SINKS = 'LIST_SINKS',
  CAST_VIEW = 'CAST_VIEW',
  CREATE_VIEW = 'CREATE_VIEW',
  LIST_VIEW = 'LIST_VIEW',
  DELETE_VIEW = 'DELETE_VIEW',
  SELECT_VIEW = 'SELECT_VIEW',
  START_STREAM_VIEW = 'START_STREAM_VIEW',
  EVENT_STREAM_VIEW = 'EVENT_STREAM_VIEW',
  STOP_STREAM_VIEW = 'STOP_STREAM_VIEW',
}

export const PacketIO = t.type({
  type: t.keyof(PayloadType),
  sent: DateIO,
  payload: t.unknown,
  error: t.union([t.string, t.undefined]),
  sequence: t.number,
  ack: t.union([t.boolean, t.undefined])
})

export type Packet = t.TypeOf<typeof PacketIO>

export const HelloPayloadIO = t.type({
  name: t.string,
  version: t.string
})

export const ShowPayloadIO = t.type({
  url: t.string,
  worker: t.union([t.undefined, t.string]),
  view: t.string
})

export const ListSinkPayloadIO = t.type({
  sinks: t.array(SinkIO),
  worker: t.union([t.undefined, t.string]),
  view: t.string
})

export const CastViewPayloadIO = t.type({
  sinkName: t.string,
  worker: t.string,
  view: t.string
})

export const CreateViewPayloadIO = t.type({
  id: t.string,
  worker: t.union([t.undefined, t.string]),
  url: t.union([ t.undefined, t.string ])
})

export const ListViewPayloadIO = t.type({
  worker: t.union([t.undefined, t.string]),
  views: ViewIO
})

export const DeleteViewPayloadIO = t.type({
  worker: t.union([t.undefined, t.string]),
  id: t.string,
})

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
      t.literal('keypress')
    ]),
    params: t.any
  })
})

export const StopStreamViewPayLoadIO = t.type({
  worker: t.string,
  view: t.string
})