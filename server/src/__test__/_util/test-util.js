import { Readable, Transform, Writable } from 'node:stream'
import { jest } from '@jest/globals'

export class TestUtil {
  static mockDateNow (mockImplementationPeriods) {
    const now = jest.spyOn(global.Date, global.Date.now.name)
    mockImplementationPeriods.forEach(time => {
      now.mockReturnValueOnce(time)
    })
  }

  static getTimeFromDate (dateString) {
    return new Date(dateString).getTime()
  }

  static generateReadableStream (data) {
    return new Readable ({
      objectMode: true,
      read () {
        for (const item of data) {
          this.push(item)
        }
        this.push(null)
      }
    })
  }

  static generateWritableStream (onData) {
    return new Writable ({
      objectMode: true,
      write (chunk, encoding, callback) {
        onData(chunk)
        callback(null, chunk)
      }
    })
  }

  static generateTransformStream (onData) {
    return new Transform ({
      objectMode: true,
      transform (chunk, encoding, callback) {
        onData(chunk)
        callback(null, chunk)
      }
    })
  }
}
