'use strict'

// load env
import customEnv from 'custom-env'
customEnv.env(process.env.NODE_ENV)
// load patching modules
import 'express-async-errors'
import 'reflect-metadata'

import express from 'express'
import * as path from 'path'
import logger from 'morgan'
import * as bodyParser from 'body-parser'
import cors from 'cors'
import Redis from 'ioredis'
import async from 'async'
import * as http from 'http'
// import { createConnection } from 'typeorm'

import {
  ScreenController
} from './controllers/index'

import { AddressInfo } from 'net'
import { Manager } from './manager'

export type ModelRepositories = {}

declare module 'express' {
  export interface Request {
    models: ModelRepositories
    redis: Redis.Redis,
    manager: Manager
  }
}

const run = async () => {
  // @ts-ignore
  let modelRepositories: ModelRepositories = {}
  let redis: Redis.Redis
  const app = express()
  const manager = new Manager()
  app.use(cors())
  const rootRouter = express.Router()
  app.use('/v1/', rootRouter)

  // setup connections to databases
  await async.series([
    // (cb: Function) => {
    //   createConnection({
    //     type: "postgres",
    //     host: process.env.POSTGRESQL_HOST,
    //     database: process.env.POSTGRESQL_DB,
    //     username: process.env.POSTGRESQL_USER,
    //     password: process.env.POSTGRESQL_PASSWORD,
    //     entities: [],
    //     synchronize: process.env.NODE_ENV !== 'production',
    //     logging: false
    //   }).then(conn => {
    //     modelRepositories = {}
    //     return cb()
    //   })
    // },
    // (cb: Function) => {
    //   const redisClient = new Redis({
    //     port: parseInt(process.env.REDIS_PORT || '', 10),
    //     host: process.env.REDIS_HOST
    //   })
    //   redisClient.on('ready', () => {
    //     redis = redisClient
    //     return cb(null, redisClient)
    //   })
    //   redisClient.once('error', (err) => cb(err))
    // }
    async () => {
      await manager.init()
    }
  ])
  
  if (process.env.NODE_ENV !== 'test') {
    rootRouter.use(logger('dev'))
  }
  rootRouter.use(express.static(path.join(__dirname, './public')))
  rootRouter.use(bodyParser.urlencoded({ extended: false }))
  rootRouter.use(bodyParser.json())
  
  /**
   * Expose queue directly inside every request so we don't need to have
   *  a singleton somewhere
   */
  rootRouter.use((req: express.Request, res, next) => {
    req.redis = redis
    req.manager = manager
    // @ts-ignore
    req.locals = {}
    req.models = modelRepositories
    return next()
  })
  
  /**
   * Instanciate every controller so they can bind their routes
   */
  /*eslint-disable */
  new ScreenController(rootRouter, modelRepositories)
  /* eslint-enable */
  
  /**
   * Errors middlewares that will handle errors thrown
   *  from controllers/middlewares
   */
  rootRouter.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      if (typeof err.message === 'object') {
        err.message = err.message.msg
      }
      console.error('Error in express routes', err)
      return res.status(err.statusCode || 500).json({
        message: err.message,
        cause: err.type && err.type.startsWith('Mongo') ? 'Database Error' : 'Internal Error'
      })
    }
    return next()
  })

  const port = process.env.PORT || '3000'
  app.set('port', port)
  const server = http.createServer(app)
  server.listen(port, () => {
    const addr = server.address() as AddressInfo
    console.log(`API listening on ${addr.address}:${addr.port}`)
  })
}

run()
