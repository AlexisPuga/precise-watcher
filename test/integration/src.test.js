const fse = require('fs-extra')
const path = require('path')
const mockJson = (filepath, json) => jest.doMock(filepath, () => (json), {
  virtual: true
})
const wait = async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})
const mockDebugFn = jest.fn()
// Based on https://github.com/kentor/flush-promises
const flushPromises = () => new Promise((resolve) => global.setTimeout(resolve, 300))

jest.mock('debug', () => {
  return jest.fn().mockImplementation(() => mockDebugFn)
})
jest.spyOn(console, 'log').mockImplementation(() => {})

describe('/src', () => {
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

  it('Should read given sources', async () => {
    const mockRunCmd = jest.fn()
    let preciseWatcher

    return new Promise((resolve) => {
      jest.doMock('../../src/lib/run-cmd', () => {
        let order = 0

        mockRunCmd.mockImplementation(async (cmd, args) => {
          if (cmd === 'sleep') {
            const ms = parseFloat(args) * 1000

            await wait(ms)
          }

          order++

          const callsCount = order
          const cmdCount = 3

          if (callsCount === cmdCount) {
            resolve()
          }

          return order
        })

        return async (...args) => mockRunCmd(...args)
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

      preciseWatcher = require('../../src')

      const { start } = preciseWatcher

      start().then(([watcher]) => {
        watcher.on('ready', async () => {
          await fse.writeFile(testFile, '1')
        })
      })
    }).then(() => {
      // then, it gets queued in order:
      expect(mockRunCmd).toHaveBeenNthCalledWith(1, 'sleep', ['.15s'], { cwd: userDirectory })
      expect(mockRunCmd).toHaveBeenNthCalledWith(2, 'echo', ['serial'], { cwd: userDirectory })
      expect(mockRunCmd).toHaveBeenNthCalledWith(3, 'echo', [`test/${testFilename}`], { cwd: userDirectory })

      // but, it gets called in disorder:
      // 0 (call) -> 3 (order) -> first call was last.
      expect(mockRunCmd.mock.results[0].value).resolves.toBe(3)
      expect(mockRunCmd.mock.results[1].value).resolves.toBe(1)
      expect(mockRunCmd.mock.results[2].value).resolves.toBe(2)
    }).finally(async () => {
      jest.unmock('../../src/lib/run-cmd')
      mockRunCmd.mockClear()
      await preciseWatcher.stop()
    })
  })

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

  it('Should set a default value for each supported token and respect ' +
    'the src.baseDir options.', async (done) => {
    const { start } = preciseWatcher

    mockJson('../../package.json', {
      'precise-watcher': {
        src: [{
          pattern: 'test/integration/src.test.js',
          on: 'ready',
          baseDir: 'test/integration',
          ignoreFrom: 'test/fixtures/.gitignore-like',
          run: [{
            cmd: 'echo',
            args: ['<file>']
          }]
        }]
      }
    })

    const [watcher] = await start()

    watcher.on('ready', () => {
      expect(mockDebugFn).toHaveBeenCalledWith('The path argument is empty. Using default value.')
      // Should remove ignored paths from default values:
      expect(mockDebugFn).toHaveBeenCalledWith('Replacing <file> with src.test.js')
      done()
    })
  })

  it('Should replace <file> and call the same command multiple times ' +
    'with each given pattern, when a default value is used.', async (done) => {
    const { start } = preciseWatcher

    mockJson('../../package.json', {
      'precise-watcher': {
        src: [{
          pattern: [
            'test/fixtures/package.json',
            'test/fixtures/precise-watcher.config.js'
          ],
          on: 'ready',
          ignoreFrom: null,
          run: [{
            cmd: 'echo',
            args: ['<file>']
          }]
        }]
      }
    })

    const [watcher] = await start()

    watcher.on('ready', async () => {
      await flushPromises()

      expect(mockDebugFn).toHaveBeenCalledWith('Replacing <file> with test/fixtures/package.json')
      expect(mockDebugFn).toHaveBeenCalledWith('Replacing <file> with test/fixtures/precise-watcher.config.js')

      // Make sure to stop watching to prevent open handles:
      await watcher.close()
      done()
    })
  })
})
