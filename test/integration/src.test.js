const fs = require('fs')
const path = require('path')
const mockJson = (filepath, json) => jest.doMock(filepath, () => (json), {
  virtual: true
})
const wait = async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

jest.mock('child_process')

describe('/src', () => {
  const { exec } = require('child_process')
  const preciseWatcher = require('../../src')

  beforeEach(() => {
    jest.resetModules()
  })

  it('Should read config from "precise-watcher" property located in ' +
    'users\' package.json, by default', async () => {
    // Should return early (returning false).
    mockJson('../../package.json', {
      'precise-watcher': {}
    })

    expect(preciseWatcher()).toBe(true)
  })

  it('Should read given sources', async (done) => {
    const destinationFilename = 'test.temp'
    const destinationFile = path.join(process.cwd(), destinationFilename)
    let calls = 0

    exec.mockImplementation((cmd, options) => {
      expect(cmd).toBe(`echo ${destinationFilename}`)
      calls++

      if (calls === 2) {
        fs.unlinkSync(destinationFile)
        done()
      }
    })
    mockJson('../../package.json', {
      'precise-watcher': {
        src: [{
          pattern: '*.temp',
          run: 'echo <file>',
          chokidar: { interval: 1 }
        }]
      }
    })

    // Write initial file. This file shouldn't be handled by chokidar.
    fs.writeFileSync(destinationFile, '1')

    preciseWatcher()

    await wait(100)
    fs.writeFileSync(destinationFile, '2')
    await wait(100)
    fs.writeFileSync(destinationFile, '3')
  })
})
