import { beforeEach, describe, expect, jest, it } from '@jest/globals'

import { Routes } from './../../routes'
import { TestUtil } from './../_util/test-util'
import { UploadHandler } from './../../upload-handler'
import { logger } from './../../logger'

describe('#Routes test suite', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation()
  })

  const request = TestUtil.generateReadableStream(['fake file bytes'])
  const response = TestUtil.generateWritableStream(() => {})
  const defaultParams = {
    request: Object.assign(request, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      method: '',
      body: {}
    }),
    response: Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn()
    }),
    values: () => Object.values(defaultParams)
  }

  describe('#setSocketInstance', () => {
    it('should store io instance', () => {
      const routes = new Routes()
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {}
      }
      routes.setSocketInstance(ioObj)
      expect(routes.io).toStrictEqual(ioObj)
    })
  })

  describe('#handler', () => {
    it('given an inexistent route it should choose default route', async() => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'inexistent'
      await routes.handler(...params.values())
      expect(params.response.end).toHaveBeenCalledWith('Hello World')
    })
    it('should set any request with CORS enabled', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'inexistent'
      await routes.handler(...params.values())
      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })
    it('given method OPTIONS it should choose options route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'OPTIONS'
      await routes.handler(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(204)
      expect(params.response.end).toHaveBeenCalled()
    })
    it('given method GET it should choose get route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'GET'
      jest.spyOn(routes, routes.get.name).mockResolvedValue()
      await routes.handler(...params.values())
      expect(routes.get).toHaveBeenCalled()
    })
    it('given method POST it should choose post route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'POST'
      jest.spyOn(routes, routes.post.name).mockResolvedValue()
      await routes.handler(...params.values())
      expect(routes.post).toHaveBeenCalled()
    })
  })

  describe('#GET', () => {
    it('given method GET it should list all files downloaded', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      const filesStatusesMock = [
        {
          size: "127 kB",
          lastModified: '2023-02-18T06:57:23.073Z',
          owner: 'dracarys',
          file: 'file.png'
        }
      ]
      jest.spyOn(routes.fileHelper, routes.fileHelper.getFilesStatus.name).mockResolvedValue(filesStatusesMock)
      params.request.method = 'GET'
      await routes.handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(200)
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(filesStatusesMock))
    })
  })

  describe('#POST', () => {
    it('should validate post route workflow', async () => {
      const routes = new Routes('./fake-folder')
      const options = { ...defaultParams }
      options.request.method = 'POST'
      options.request.url = '?socketId=10'
      jest.spyOn(
        UploadHandler.prototype,
        UploadHandler.prototype.registerEvents.name
      ).mockImplementation((headers, onFinish) => {
        const writable = TestUtil.generateWritableStream(() => {})
        writable.on('finish', onFinish)
        return writable
      })
      await routes.handler(...options.values())

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
      expect(options.response.writeHead).toHaveBeenCalledWith(201)

      const expectedResult = JSON.stringify({ message: 'Files uploaded with success' })

      expect(options.response.end).toHaveBeenCalledWith(expectedResult)
    })
  })
})
