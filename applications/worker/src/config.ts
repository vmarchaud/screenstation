
import { randomString } from '../../shared/utils/common'
import * as pkg from '../package.json'
import { tmpdir } from 'os'
import * as path from 'path'

const NAME = process.env.STATION_NAME || `screenstation-${randomString(5)}`
export default {
  VERSION: pkg.version,
  DEFAULT_URL: 'https://google.com/', // `file://${path.resolve(__dirname, './resources/background.jpg')}`,
  LAUNCH_POSITION: process.env.STATION_LAUNCH_POSITION || '0,0',
  TEST: 1,
  NAME,
  PUPPETEER_STORAGE_PATH: process.env.PUPPETEER_STORAGE_PATH || path.resolve(tmpdir(), 'screenstation_store', NAME)
}