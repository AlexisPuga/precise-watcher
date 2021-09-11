const path = require('path')
const { promisify } = require('util')
const { execFile } = require('child_process')
const execFileAsync = promisify(execFile)
const commonEnv = {
  ...process.env,
  // Disable stdout/stderr styling.
  FORCE_COLOR: 0
}

// Disabling colors doesn't seem to work.
// That's why we use regexp to test stderr and stdout.
// require('colors').disable()

describe('precise-watcher', () => {
  test.each([
    ['default', []],
    ['"start"', ['start']]
  ])('Should work with defaults using the %s command.', async ($0, args) => {
    const { stderr, stdout } = await execFileAsync('bin/cli', args, {
      env: commonEnv
    })

    expect(stderr).toBe('')
    expect(stdout).toBe([
      'Starting precise-watcher',
      '\nStopping precise-watcher'
    ].join('\n') + '\n')
  })

  test.each([
    [[]],
    [['start']]
  ])('Should handle all known options.', async (args) => {
    const cwd = __dirname
    const config = '../fixtures/precise-watcher.config.js'

    const { stderr, stdout } = await execFileAsync('bin/cli', args.concat([
      '--cwd',
      cwd,
      '--config',
      config
    ]), {
      env: {
        ...commonEnv,
        DEBUG: 'precise-watcher'
      }
    })

    // The "debug" internal module sends the output via stderr.
    expect(stderr).toMatch(`Setting cwd to ${cwd}`)
    expect(stderr).toMatch(`Setting config to ${config}`)
    expect(stderr).toMatch(`Reading ${path.join(cwd, config)}`)
    expect(stdout).toBe([
      'Starting precise-watcher',
      '\nStopping precise-watcher'
    ].join('\n') + '\n')
  })

  it('Should handle the "stop" command.', async () => {
    const { stdout, stderr } = await execFileAsync('bin/cli', ['stop'], {
      env: commonEnv
    })

    expect(stderr).toBe('')
    expect(stdout).toBe('\nStopping precise-watcher\n')
  })
})
