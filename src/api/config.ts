
export default {
  MASTER_WEBSOCKET: process.env.MASTER_WEBSOCKET,
  WORKER_WEBSOCKET_PORT: parseInt(process.env.WORKER_WEBSOCKET_PORT || '8001', 10),
  USER_WEBSOCKET_PORT: parseInt(process.env.USER_WEBSOCKET_PORT || '8000', 10)
}