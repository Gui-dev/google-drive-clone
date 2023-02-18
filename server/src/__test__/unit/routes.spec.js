import { describe, expect, it } from '@jest/globals'

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
})
