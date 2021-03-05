const { promisify } = require('util')
const { execFile } = require('child_process')
const execFileAsync = promisify(execFile)

describe('precise-watcher', () => {
  it('Should work with defaults', async () => {
    const { stderr, stdout } = await execFileAsync('bin/cli')

    expect(stderr).toBe('')
    expect(stdout).toBe('Stopping precise-watcher...\n')
  })
})
