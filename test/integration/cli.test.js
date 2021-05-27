const path = require('path')
const { promisify } = require('util')
const { execFile } = require('child_process')
const execFileAsync = promisify(execFile)

describe('precise-watcher', () => {
  test.each([
    ['default', []],
    ['"start"', ['start']]
  ])('Should work with defaults using the %s command.', async ($0, args) => {
    const { stderr, stdout } = await execFileAsync('bin/cli', args)

    expect(stderr).toBe('')
    expect(stdout).toBe([
      'Starting precise-watcher...',
      'Stopping precise-watcher...'
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
        ...process.env,
        DEBUG: 'precise-watcher'
      }
    })

    // The "debug" internal module sends the output via stderr.
    expect(stderr).toMatch(`Setting cwd to ${cwd}`)
    expect(stderr).toMatch(`Setting config to ${config}`)
    expect(stderr).toMatch(`Reading ${path.join(cwd, config)}`)
    expect(stdout).toBe([
      'Starting precise-watcher...',
      'Stopping precise-watcher...'
    ].join('\n') + '\n')
  })

  it('Should handle the "stop" command.', async () => {
    const { stdout, stderr } = await execFileAsync('bin/cli', ['stop'])

    expect(stderr).toBe('')
    expect(stdout).toBe('Stopping precise-watcher...\n')
  })
})
