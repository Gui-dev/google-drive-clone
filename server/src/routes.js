import { dirname, resolve } from 'node:path'
import { fileURLToPath, parse } from 'node:url'
import { pipeline } from 'node:stream/promises'

import { logger } from './logger.js'
import { UploadHandler } from './upload-handler'
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
    const { headers } = request
    const { query: { socketId } } = parse(request.url, true)
    const uploadHandler = new UploadHandler({
      io: this.io,
      socketId,
      downloadsFolder: this.downloasdFolder
    })
    const onFinish = response => () => {
      response.writeHead(201)
      const data = JSON.stringify({ message: 'Files uploaded with success' })
      response.end(data)
    }
    const busboyInstance = uploadHandler.registerEvents(headers, onFinish(response))
    await pipeline(
      request,
      busboyInstance
    )

    logger.info('Request finished with success!!!')
  }

  handler (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*')
    const chosen = this[request.method.toLowerCase()] || this.defaultRoute
    return chosen.apply(this, [request, response])
  }
}
