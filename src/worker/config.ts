import * as path from 'path'
import { randomString } from '../shared/utils/common'
import * as pkg from '../../package.json'

export default {
  VERSION: pkg.version,
  MASTER_WEBSOCKET: process.env.MASTER_WEBSOCKET,
  DEFAULT_URL: 'https://google.fr', // `file://${path.resolve(__dirname, './resources/background.jpg')}`,
  LAUNCH_POSITION: process.env.LAUNCH_POSITION || '0,0',
  TEST: 1,
  NAME: process.env.STATION_NAME || `screenstation-${randomString(5)}`
}