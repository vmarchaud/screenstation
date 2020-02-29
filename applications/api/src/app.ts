'use strict'

import async from 'async'
import MDNS from 'multicast-dns'
import { networkInterfaces } from 'os'

import config from './config'
import { WorkerManager } from './workerManager'
import { UserManager } from './userManager'

export type ModelRepositories = {}

const run = async () => {
  const manager = new WorkerManager()
  const userManager = new UserManager()

  // setup connections to databases
  await async.series([
    async () => {
      await manager.init()
      await userManager.init(manager)
      const interfaces = networkInterfaces()
      const externalInterface = Object.keys(interfaces).find(name => {
        return interfaces[name].every(address => address.internal === false)
      })
      const address = externalInterface && interfaces[externalInterface] ? interfaces[externalInterface][0].address : '127.0.0.1'
      const mdns = MDNS()
      mdns.on('query', (query) => {
        if (query.questions.length === 0) return
        const domain = query.questions[0].name
        switch (domain) {
          case 'api.screenstation.local': {
            mdns.respond({
              answers: [{
                name: 'api.screenstation.local',
                type: 'A',
                data: address
              }]
            })
            break
          }
          case 'screenstation.local': {
            mdns.respond({
              answers: [{
                name: 'screenstation.local',
                type: 'A',
                data: address
              }]
            })
            break
          }
          case 'workers.screenstation.local': {
            mdns.respond({
              answers: [{
                name: 'workers.screenstation.local',
                type: 'SRV',
                data: {
                  port: config.WORKER_WEBSOCKET_PORT,
                  weigth: 0,
                  priority: 10,
                  target: address
                }
              }]
            })
            break
          }
        }
      })
    }
  ])
}

run()
