import { afterAll, beforeAll, beforeEach, describe, expect, jest, it } from '@jest/globals'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import FormData from 'form-data'

import { TestUtil } from './../_util/test-util'
import { Routes } from './../../routes'
import { logger } from './../../logger'

describe('#Routes Integration Test', () => {
  let defaultDownloadsFolder = ''
  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
  })

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
  })

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation()
  })

  describe('#getFileStatus', () => {
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, message) => {}
    }


    it('should upload file to the folder', async () => {
      const routes = new Routes(defaultDownloadsFolder)
      const filename = 'mario.png'
      const fileStream = fs.createReadStream(`./src/__test__/integration/mocks/${filename}`)
      const response = TestUtil.generateWritableStream(() => {})
      const form = new FormData()
      form.append('photo', fileStream)

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: 'POST',
          url: '?socketId=10',
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn()
        }),
        values: () => Object.values(defaultParams)
      }
      routes.setSocketInstance(ioObj)
      const emptyDir = await fs.promises.readdir(defaultDownloadsFolder)

      expect(emptyDir).toEqual([])

      await routes.handler(...defaultParams.values())
      const fullDir = await fs.promises.readdir(defaultDownloadsFolder)

      expect(fullDir).toEqual([filename])
      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(201)

      const expectedResult = JSON.stringify({ message: 'Files uploaded with success' })

      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult)

    })
  })
})
