const { promisify } = require('util')
const { execFile } = require('child_process')
const execFileAsync = promisify(execFile)

describe('precise-watcher', () => {
  test.each([
    ['default'],
    ['"start"', ['start']]
  ])('Should work with defaults using the %s command.', async ($0, args) => {
    const { stderr, stdout } = await execFileAsync('bin/cli', args)

    expect(stderr).toBe('')
    expect(stdout).toBe('Stopping precise-watcher...\n')
  })

  test.each([
    [[]],
    [['start']]
  ])('Should handle all known options.', async (args) => {
    const { stderr, stdout } = await execFileAsync('bin/cli', args.concat([
      '--cwd',
      __dirname,
      '--config',
      '../fixtures/precise-watcher.config.js'
    ]))

    // @TODO Test debugging.

    expect(stderr).toBe('')
    expect(stdout).toBe([
      'Stopping precise-watcher...'
    ].join('\n') + '\n')
  })
})
