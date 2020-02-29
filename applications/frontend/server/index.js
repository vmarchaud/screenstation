
const express = require('express')
const morgan = require('morgan')

const app = express()
app.use(morgan('tiny'))
app.use(express.static('dist'))
const port = parseInt(process.env.FRONTEND_PORT || '80', 10)
app.listen(port, () => {
  console.log(`Frontend ready on ${port}`)
})
