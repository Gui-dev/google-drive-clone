import https from 'https'
import fs from 'node:fs'

import { logger } from './logger.js'

const PORT = process.env.PORT || 3333
const localHostSSL = {
  key: fs.readFileSync('./certificates/key.pem'),
  cert: fs.readFileSync('./certificates/cert.pem'),
}

const server = https.createServer(
  localHostSSL,
  (req, res) => {
    res.end('Hello World')
  }
)

const startServer = () => {
  const { address, port } = server.address()
  logger.info(`Server running at https://${address}:${port}`)
}

server.listen(PORT, startServer)
