
const express = require('express')
const morgan = require('morgan')
const MDNS = require('multicast-dns')
const { networkInterfaces } = require('os')
const path = require('path')

const app = express()
app.use(morgan('tiny'))
app.use(express.static(path.resolve(__dirname, '../dist')))
const port = parseInt(process.env.FRONTEND_PORT || '80', 10)
const mdns = MDNS()
app.listen(port, () => {
  console.log(`Frontend ready on ${port}`)
  const interfaces = networkInterfaces()
  const externalInterface = Object.keys(interfaces).find(name => {
    return interfaces[name].every(address => address.internal === false)
  })
  const address = externalInterface && interfaces[externalInterface] ? interfaces[externalInterface][0].address : '127.0.0.1'
  mdns.on('error', err => {
    console.log(err)
  })
  mdns.on('query', (query) => {
    if (query.questions.length === 0) return
    const domain = query.questions[0].name
    if (domain === 'screenstation.local') {
      mdns.respond({
        answers: [{
          name: 'screenstation.local',
          type: 'A',
          ttl: 60,
          data: address
        }]
      })
    }
  })
})
