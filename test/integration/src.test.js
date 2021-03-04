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
  const userDirectory = process.cwd()
  const testFilename = 'example'
  const testFile = path.join(userDirectory, 'temp/test/', testFilename)

  beforeEach(() => {
    jest.resetModules()
    // Write initial file. This file shouldn't be handled by chokidar.
    fse.ensureFileSync(testFile)
  })

  afterEach(() => {
    fse.unlinkSync(testFile)
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

    preciseWatcher()

    await wait(100)
    await fse.writeFile(testFile, '1')
    await wait(100)
    await fse.writeFile(testFile, '2')

    expect(runCmd).toHaveBeenCalledTimes(2)
    expect(runCmd).toHaveBeenNthCalledWith(1, 'echo', [
      `test/${testFilename}`
    ], {
      cwd: userDirectory
    })
    expect(runCmd).toHaveBeenNthCalledWith(2, 'echo', [
      `test/${testFilename}`
    ], {
      cwd: userDirectory
    })
  })
})
