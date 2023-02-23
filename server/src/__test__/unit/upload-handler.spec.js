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
      jest.spyOn(uploadHanlder, uploadHanlder.canExecute.name).mockReturnValueOnce(true)
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

    it('given message timerDelay as 2secs it should emit only on message during 2 seconds period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name)
      const day = '2023-02-22 16:45'
      const twoSecondsPeriod = 2000
      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`) // -> Date.now do this.lastMessagesSent em handleFileBytes
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`) // -> hello chegou
      const onSecondUpdateLastMessageSent = onFirstCanExecute
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`) // -> segundo hello esta fora da janela de tempo
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`) // -> world
      TestUtil.mockDateNow([
        onFirstLastMessageSent,
        onFirstCanExecute,
        onSecondUpdateLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute
      ])
      const messages = ['hello', 'hello', 'world']
      const filename = 'filename.avi'
      const expectedMessageSent = 2

      const source = TestUtil.generateReadableStream(messages)
      const uploadHanlder = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder: '/tmp',
        messageTimeDelay: twoSecondsPeriod
      })
      await pipeline(
        source,
        uploadHanlder.handleFileBytes(filename)
      )


      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessageSent)

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls

      expect(firstCallResult).toEqual(
        [
          uploadHanlder.ON_UPLOAD_EVENT,
          {
            processedAlready: 'hello'.length,
            filename
          }
        ]
      )
      expect(secondCallResult).toEqual(
        [
          uploadHanlder.ON_UPLOAD_EVENT,
          {
            processedAlready: messages.join('').length,
            filename
          }
        ]
      )
    })
  })

  describe('#canExecute', () => {

    it('should return true when time is later than specified delay', async () => {
      const timerDelay = 1000
      const uploadHanlder = new UploadHandler({
        io: {},
        socketId: '',
        downloadsFolder: '/tmp',
        messageTimeDelay: timerDelay
      })
      const tickNow = TestUtil.getTimeFromDate('2023-02-22 16:45:03')
      TestUtil.mockDateNow([tickNow])
      const lastExecution = TestUtil.getTimeFromDate('2023-02-22 16:45:00')
      const result = uploadHanlder.canExecute(lastExecution)

      expect(result).toBeTruthy()
    })

    it('should return false when time isnt later than specified delay', async () => {
      const timerDelay = 3000
      const uploadHanlder = new UploadHandler({
        io: {},
        socketId: '',
        downloadsFolder: '/tmp',
        messageTimeDelay: timerDelay
      })
      const tickNow = TestUtil.getTimeFromDate('2023-02-22 16:45:02')
      TestUtil.mockDateNow([tickNow])
      const lastExecution = TestUtil.getTimeFromDate('2023-02-22 16:45:01')
      const result = uploadHanlder.canExecute(lastExecution)

      expect(result).toBeFalsy()
    })
  })
})
