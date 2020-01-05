import * as url from 'url'

export default {
  MASTER_WEBSOCKET: process.env.MASTER_WEBSOCKET,
  WEBSOCKET_PORT: parseInt(url.parse(process.env.MASTER_WEBSOCKET!).port!, 10)
}