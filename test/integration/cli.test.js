const { promisify } = require('util')
const { execFile } = require('child_process')
const execFileAsync = promisify(execFile)

describe('precise-watcher', () => {
  const run = async () => await execFileAsync('bin/cli', {
    signal
  })
  let abortController
  let signal

  beforeEach(() => {
    abortController = new global.AbortController()
    signal = abortController.signal
  })

  afterEach(() => {
    abortController.abort()
  })

  it('Should work with defaults', async () => {
    const { stderr, stdout } = await run()

    expect(stderr).toBe('')
    expect(stdout).toBe('Stopping precise-watcher...\n')
  })
})
