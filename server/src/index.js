import https from 'https'
import http from 'http'
import fs from 'node:fs'
import { Server } from 'socket.io'

import { Routes } from './routes.js'
import { logger } from './logger.js'

const isProduction = process.env.NODE_ENV === 'production'
process.env.USER = process.env.USER ?? 'system_user'
const PORT = process.env.PORT || 3333
const localHostSSL = {
  key: fs.readFileSync('./certificates/key.pem'),
  cert: fs.readFileSync('./certificates/cert.pem'),
}
const protocol = isProduction ? http : https
const sslConfig = isProduction ? {} : localHostSSL
const routes = new Routes()
const server = protocol.createServer(
  sslConfig,
  routes.handler.bind(routes)
)

const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: false
  }
})
routes.setSocketInstance(io)
io.on('connection', socket => logger.info(`Someone connected: ${socket.id}`))

const startServer = () => {
  const { address, port } = server.address()
  const protocol = isProduction ? 'http' : 'https'
  logger.info(`Server running at ${protocol}://${address}:${port}`)
}

server.listen(PORT, startServer)
