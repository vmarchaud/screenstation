'use strict'

import express from 'express'
import { ModelRepositories } from '../app'

export class ScreenController {
  constructor (rootRouter: express.Router, repositories: ModelRepositories) {
    const router = express.Router({ mergeParams: true })

    router.get('/', this.list.bind(this))
    router.post('/:id/url', this.setUrl.bind(this))
    router.post('/:id/raw/:type', this.sendRaw.bind(this))

    rootRouter.use('/stations', router)
  }

  async list (req: express.Request, res: express.Response) {
    return res.status(200).send(req.manager.clients.map(client => ({
      name: client.name,
      id: client.id,
      version: client.version,
      url: client.url
    })))
  }

  async setUrl (req: express.Request, res: express.Response) {
    console.log(req.body)
    req.manager.sendMessage(req.params.id, {
      type: 'SHOW',
      sent: new Date(),
      sequence: 0,
      error: undefined,
      payload: {
        url: req.body.url
      },
      ack: undefined
    })
    return res.sendStatus(200)
  }

  async sendRaw (req: express.Request, res: express.Response) {
    console.log(req.body)
    req.manager.sendMessage(req.params.id, {
      type: req.params.type.toUpperCase(),
      sent: new Date(),
      sequence: 0,
      error: undefined,
      payload: req.body,
      ack: undefined
    })
    return res.sendStatus(200)
  }
}
