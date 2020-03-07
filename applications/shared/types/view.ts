import { CDPSession, Page } from 'puppeteer'
import { Sink, SinkIO } from './sink'
import * as t from 'io-ts'

export type View = {
  id: string,
  session: CDPSession,
  page: Page,
  currentURL?: string,
  sink?: Sink,
  isSelected: boolean
}

export const ViewIO = t.type({
  id: t.string,
  worker: t.string,
  currentURL: t.union([ t.undefined, t.string ]),
  sink: t.union([ t.undefined, SinkIO ]),
  isSelected: t.boolean
})