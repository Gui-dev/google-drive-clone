import { describe, expect, jest, it } from '@jest/globals'
import fs from 'node:fs/promises'

import { FileHelper } from './../../file-helper.js'
import { Routes } from './../../routes'

describe('#FileHelper', () => {
  describe('#getFileStatus', () => {
    it('should return files statuses in correct format', async () => {
      const statMock = {
        dev: 2049,
        mode: 33188,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 869394,
        size: 127487,
        blocks: 256,
        atimeMs: 1676703443072.724,
        mtimeMs: 1627975016000,
        ctimeMs: 1676703443116.7244,
        birthtimeMs: 1676703443072.7249,
        atime: '2023-02-18T06:57:23.073Z',
        mtime: '2021-08-03T07:16:56.000Z',
        ctime: '2023-02-18T06:57:23.117Z',
        birthtime: '2023-02-18T06:57:23.073Z'
      }
      const mockUser = 'dracarys'
      process.env.USER = mockUser
      const filename = 'file.png'
      jest.spyOn(fs, fs.readdir.name).mockResolvedValue([filename])
      jest.spyOn(fs, fs.stat.name).mockResolvedValue(statMock)
      const result = await FileHelper.getFilesStatus('/tmp')
      const expectedResult = [
        {
          size: "127 kB",
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: filename
        }
      ]

      expect(fs.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
      expect(result).toMatchObject(expectedResult)
    })
  })
})
