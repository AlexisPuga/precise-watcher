const fse = require('fs-extra')
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
    const destinationFilename = 'example'
    const destinationFile = path.join(process.cwd(), 'temp/test/', destinationFilename)
    let calls = 0

    // @FIXME Disable logs
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation((error) => done(error))

    exec.mockImplementation((cmd, options) => {
      expect(cmd).toBe(`echo test/${destinationFilename}`)
      calls++

      if (calls === 2) {
        fse.unlinkSync(destinationFile)
        done()
      }
    })
    mockJson('../../package.json', {
      'precise-watcher': {
        src: [{
          pattern: 'temp/**/*',
          baseDir: 'temp',
          run: 'echo <file>',
          chokidar: { interval: 1 }
        }]
      }
    })

    // Write initial file. This file shouldn't be handled by chokidar.
    await fse.ensureFile(destinationFile)

    preciseWatcher()

    await wait(100)
    await fse.writeFile(destinationFile, '1')
    await wait(100)
    await fse.writeFile(destinationFile, '2')
  })
})
