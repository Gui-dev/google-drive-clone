import { describe, expect, jest, it } from '@jest/globals'

import { Routes } from './../../routes'

describe('#Routes test suite', () => {
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
    const defaultParams = {
      request: {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        method: '',
        body: {}
      },
      response: {
        setHeader: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn()
      },
      values: () => Object.values(defaultParams)
    }
    it('given an inexistent route it should choose default route', () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'inexistent'
      routes.handler(...params.values())
      expect(params.response.end).toHaveBeenCalledWith('Hello World')
    })
    it('should set any request with CORS enabled', () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'inexistent'
      routes.handler(...params.values())
      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })
    it.todo('given method OPTIONS it should choose options route')
    it.todo('given method GET it should choose get route')
    it.todo('given method POST it should choose post route')
  })
})
