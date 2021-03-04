const fse = require('fs-extra')
const path = require('path')
const mockJson = (filepath, json) => jest.doMock(filepath, () => (json), {
  virtual: true
})
const wait = async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

jest.mock('../../src/lib/run-cmd')
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})

describe('/src', () => {
  const runCmd = require('../../src/lib/run-cmd')
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

  it('Should read given sources', async () => {
    const userDirectory = process.cwd()
    const destinationFilename = 'example'
    const destinationFile = path.join(userDirectory, 'temp/test/', destinationFilename)

    runCmd.mockImplementation(() => Promise.resolve(0))

    mockJson('../../package.json', {
      'precise-watcher': {
        src: [{
          pattern: 'temp/**/*',
          baseDir: 'temp',
          run: [{
            cmd: 'echo',
            args: ['<file>']
          }],
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

    expect(runCmd).toHaveBeenCalledTimes(2)
    expect(runCmd).toHaveBeenNthCalledWith(1, 'echo', [
      `test/${destinationFilename}`
    ], {
      cwd: userDirectory
    })
    expect(runCmd).toHaveBeenNthCalledWith(2, 'echo', [
      `test/${destinationFilename}`
    ], {
      cwd: userDirectory
    })

    fse.unlinkSync(destinationFile)
  })
})
