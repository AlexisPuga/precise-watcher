const fse = require('fs-extra')
const path = require('path')
const mockJson = (filepath, json) => jest.doMock(filepath, () => (json), {
  virtual: true
})
const wait = async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})
const mockDebugFn = jest.fn()

jest.mock('debug', () => {
  return jest.fn().mockImplementation(() => mockDebugFn)
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

  beforeEach(async () => {
    jest.resetModules()
    jest.resetAllMocks()
    // Write initial file. This file shouldn't be handled by chokidar.
    fse.ensureFileSync(testFile)
    await preciseWatcher.stop()
  })

  afterEach(() => {
    fse.unlinkSync(testFile)
  })

  it('Should read config from "precise-watcher" property located in ' +
    'users\' package.json, by default', async () => {
    const { start } = preciseWatcher

    // Should return early (returning false).
    mockJson('../../package.json', {
      'precise-watcher': {}
    })

    expect(await start()).toMatchObject([])
    expect(mockDebugFn).toHaveBeenCalledWith('Reading "precise-watcher" property from package.json.')
  })

  it('Should read given sources', async () => new Promise((resolve) => {
    const { start } = preciseWatcher
    let order = 0

    runCmd.mockImplementation(async (cmd, args) => {
      if (cmd === 'sleep') {
        const ms = parseFloat(args) * 1000

        await wait(ms)
      }

      order++

      const calls = order
      const cmdCount = 3

      if (calls === cmdCount) {
        resolve()
      }

      return order
    })
    mockJson('../../package.json', {
      'precise-watcher': {
        src: [{
          pattern: 'temp/**/*',
          baseDir: 'temp',
          ignoreFrom: null,
          run: [{
            cmd: 'sleep',
            args: ['.15s'],
            callNext: 'parallel'
          }, {
            cmd: 'echo',
            args: ['serial']
          }, {
            cmd: 'echo',
            args: ['<file>']
          }]
        }]
      }
    })

    start().then(([watcher]) => {
      watcher.on('ready', async () => {
        await fse.writeFile(testFile, '1')
      })
    })
  }).then(() => {
    // then, it gets queued in order:
    expect(runCmd).toHaveBeenNthCalledWith(1, 'sleep', ['.15s'], { cwd: userDirectory })
    expect(runCmd).toHaveBeenNthCalledWith(2, 'echo', ['serial'], { cwd: userDirectory })
    expect(runCmd).toHaveBeenNthCalledWith(3, 'echo', [`test/${testFilename}`], { cwd: userDirectory })

    // but, it gets called in disorder:
    // 0 (call) -> 3 (order) -> first call was last.
    expect(runCmd.mock.results[0].value).resolves.toBe(3)
    expect(runCmd.mock.results[1].value).resolves.toBe(1)
    expect(runCmd.mock.results[2].value).resolves.toBe(2)
  }))

  it('Should read package.json from any location.', async () => {
    const { start } = preciseWatcher

    await start({
      config: 'test/fixtures/package.json'
    })

    expect(mockDebugFn).toHaveBeenCalledWith('Reading "precise-watcher" property from package.json.')
  })

  it('Should ignore files from .gitignore-like files.', async () => {
    const { start } = preciseWatcher
    const filepath = 'test/integration/src.test.js'

    mockJson('../../package.json', {
      'precise-watcher': {
        src: [{
          pattern: filepath,
          ignoreFrom: 'test/fixtures/.gitignore-like'
        }]
      }
    })

    const [watcher] = await start()

    expect(mockDebugFn).toHaveBeenCalledWith(`Watching ${filepath},!${filepath} with the following options: ${JSON.stringify({
      cwd: userDirectory
    })}.`)
    expect(watcher._watched.size).toBe(0)
  })
})
