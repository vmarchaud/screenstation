
import * as t from 'io-ts'
import { DateIO } from '../utils/io-types'

export enum PayloadType {
  HELLO = 'HELLO',
  SHOW = 'SHOW',
  STOP = 'STOP',
  RESTART = 'RESTART'
}

export const PacketIO = t.type({
  type: t.keyof(PayloadType),
  sent: DateIO,
  payload: t.unknown,
  sequence: t.number,
  ack: t.union([t.boolean, t.undefined])
})

export type Packet = t.TypeOf<typeof PacketIO>

export const HelloPayloadIO = t.type({
  name: t.string,
  version: t.string
})

export const ShowPayloadIO = t.type({
  url: t.string
})
