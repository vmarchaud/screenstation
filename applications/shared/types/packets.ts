
import * as t from 'io-ts'
import { DateIO } from '../utils/io-types'

export enum PayloadType {
  // meta packets
  HELLO = 'HELLO',
  STOP = 'STOP',
  RESTART = 'RESTART',
  LIST_WORKERS = 'LIST_WORKERS',
  // cast plugin
  LIST_SINKS = 'LIST_SINKS',
  SELECT_SINK = 'SELECT_SINK',
  STOP_SINK = 'STOP_SINK',
  // view plugins
  SET_VIEW_URL = 'SET_VIEW_URL',
  GET_VIEW = 'GET_VIEW',
  CREATE_VIEW = 'CREATE_VIEW',
  LIST_VIEW = 'LIST_VIEW',
  DELETE_VIEW = 'DELETE_VIEW',
  SELECT_VIEW = 'SELECT_VIEW',
  RELOAD_VIEW = 'RELOAD_VIEW',
  // stream plugin
  START_STREAM_VIEW = 'START_STREAM_VIEW',
  EVENT_STREAM_VIEW = 'EVENT_STREAM_VIEW',
  STOP_STREAM_VIEW = 'STOP_STREAM_VIEW',
  // refresh plugin
  SET_REFRESH_VIEW = 'SET_REFRESH_VIEW',
  GET_REFRESH_VIEW = 'GET_REFRESH_VIEW',
  // meta plugin
  LIST_PLUGINS = 'LIST_PLUGINS'
}

export const PacketDescriptorIO = t.type({
  type: t.string
})

export type PacketDescriptor = t.TypeOf<typeof PacketDescriptorIO>

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
