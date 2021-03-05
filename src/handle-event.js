const path = require('path')
const runCmd = require('./lib/run-cmd')
const log = console.log
const pathNthArgs = {
  add: 0,
  change: 0,
  unlink: 0,
  addDir: 0,
  unlinkDir: 0,
  raw: 1
}

module.exports = (eventName, commands, {
  baseDir = '.',
  cmd: cmdOptions
}) => {
  const pathNthArg = pathNthArgs[eventName]

  return (...args) => {
    (async function next (commands) {
      const command = commands.shift()

      if (command) {
        const { cmd, args: commandArgs = [], callNext = 'serial' } = command
        const serial = callNext === 'serial'
        const parallel = callNext === 'parallel'
        const cmdArgs = commandArgs.map((cmdArg) => {
          if (cmdArg === '<file>') {
            const pathArg = args[pathNthArg]
            const pathArgRelativeToBaseDir = path.relative(baseDir, pathArg)

            return pathArgRelativeToBaseDir
          }

          return cmdArg
        })

        runCmd(cmd, cmdArgs, cmdOptions).then(async (status) => {
          log(`${cmd} exited with status ${status}`)

          if (serial) {
            await next(commands)
          }
        })

        if (parallel) {
          next(commands)
        }
      }
    })(commands)
  }
}
