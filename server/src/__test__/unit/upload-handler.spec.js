import { beforeEach, describe, expect, jest, it } from '@jest/globals'
import fs from 'node:fs'
import { resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'

import { logger } from './../../logger'
import { UploadHandler } from './../../upload-handler'
import { TestUtil } from './../_util/test-util'
import { Routes } from './../../routes'

describe('#UploadHandler', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {}
  }

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation()
  })

  describe('#registerEvents', () => {
    it('should call onFile and onFinish functions on Busboy instance', () => {
      const uploadHanlder = new UploadHandler({ io: ioObj, socketId: '01', downloadsFolder: '/tmp' })
      jest.spyOn(uploadHanlder, uploadHanlder.onFile.name).mockResolvedValue()
      const headers = { 'content-type': 'multipart/form-data; boundary=' }
      const onFinish = jest.fn()
      const busboyInstance = uploadHanlder.registerEvents(headers, onFinish)
      const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data'])
      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')
      busboyInstance.listeners('finish')[0].call()

      expect(uploadHanlder.onFile).toHaveBeenCalled()
      expect(onFinish).toHaveBeenCalled()
    })
  })

  describe('#onFile', () => {
    it('given a stream file it should save it on disk', async () => {
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/fake-folder'
      const uploadHanlder = new UploadHandler({ io: ioObj, socketId: '01', downloadsFolder })
      const onData = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name).mockImplementation(
        () => TestUtil.generateWritableStream(onData)
      )
      const onTransform = jest.fn()
      jest.spyOn(uploadHanlder, uploadHanlder.handleFileBytes.name).mockImplementation(
        () => TestUtil.generateTransformStream(onTransform)
      )
      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'fake-file.mov'
      }
      await uploadHanlder.onFile(...Object.values(params))
      const expectedFilename = resolve(uploadHanlder.downloadsFolder, params.filename)

      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
      expect(onData.mock.calls.join()).toEqual(chunks.join())
      expect(onTransform.mock.calls.join()).toEqual(chunks.join())
    })
  })

  describe('#handleFileBytes', () => {
    it('should call emit functions and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)
      const uploadHanlder = new UploadHandler({ io: ioObj, socketId: '01', downloadsFolder: '/tmp' })
      const messages = ['hello world']
      const source = TestUtil.generateReadableStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritableStream(onWrite)
      await pipeline(
        source,
        uploadHanlder.handleFileBytes('filename.txt'),
        target
      )

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)
      expect(onWrite).toBeCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())
    })
  })
})
