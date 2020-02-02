'use strict'

// load env
import customEnv from 'custom-env'
customEnv.env(process.env.NODE_ENV)
// load patching modules
import 'express-async-errors'
import 'reflect-metadata'

import async from 'async'

import { WorkerManager } from './workerManager'
import { UserManager } from './userManager'

export type ModelRepositories = {}

const run = async () => {
  const manager = new WorkerManager()
  const userManager = new UserManager()

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
      await userManager.init(manager)
    }
  ])
}

run()
