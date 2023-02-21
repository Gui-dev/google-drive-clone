import { describe, expect, jest, it } from '@jest/globals'

import { UploadHandler } from './../../upload-handler'
import { TestUtil } from './../_util/test-util'
import { Routes } from './../../routes'

describe('#UploadHandler', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {}
  }

  describe('#registerEvents', () => {
    it('should call onFile and onFinish functions on Busboy instance', () => {
      const uploadHanlder = new UploadHandler({ io: ioObj, socketId: '01' })
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
})
