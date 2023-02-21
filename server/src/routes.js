import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { logger } from './logger.js'
import { FileHelper } from './file-helper.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultDownloadsFolder = resolve(__dirname, '../', 'downloads')


export class Routes {
  io
  constructor (downloasdFolder = defaultDownloadsFolder) {
    this.downloasdFolder = downloasdFolder
    this.fileHelper = FileHelper
  }

  setSocketInstance (io) {
    this.io = io
  }

  async defaultRoute (request, response) {
    response.end('Hello World')
  }

  async options (request, response) {
    response.writeHead(204)
    response.end()
  }

  async get (request, response) {
    const files = await this.fileHelper.getFilesStatus(this.downloasdFolder)
    response.writeHead(200)
    response.end(JSON.stringify(files))
  }

  async post (request, response) {
    logger.info('post')
    response.end()
  }

  handler (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*')
    const chosen = this[request.method.toLowerCase()] || this.defaultRoute
    return chosen.apply(this, [request, response])
  }
}
