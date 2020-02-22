import * as t from 'io-ts'
import { View } from '../shared/types/view'
import { Browser } from 'puppeteer'
import { WebsocketTransport } from '../shared/utils/ws'
import { DateIO } from '../shared/utils/io-types'
import { PacketDescriptor, Packet } from '../shared/types/packets'

export type WorkerStore = {
  views: View[],
  browser: Browser,
  workerName: string,
  socket: WebsocketTransport,
  plugins: Plugin[]
}

export const PluginMetadataIO = t.type({
  displayName: t.string,
  installedAt: DateIO,
  version: t.string
})

export type PluginMetadata = t.TypeOf<typeof PluginMetadataIO>

export const PluginToLoadIO = t.type({
  path: t.string
})
export type PluginToLoad = t.TypeOf<typeof PluginToLoadIO>

export interface Plugin {
  init (store: WorkerStore): Promise<void>

  getPacketTypes (): Promise<PacketDescriptor[]>
  getMetadata (): Promise<PluginMetadata>

  handle (packet: Packet): Promise<Packet>
}