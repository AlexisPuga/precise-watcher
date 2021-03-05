const path = require('path')
const runCmd = require('./lib/run-cmd')
const log = console.log
const logError = console.error
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

  return async (...args) => {
    const next = async (commands) => await new Promise((resolve, reject) => {
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
        }).catch(reject)

        if (parallel) {
          next(commands).catch(reject)
        }

        if (!serial && !parallel) {
          reject(new TypeError(`src.callNext value (${callNext}) is invalid.`))
        }
      } else {
        resolve()
      }
    })

    try {
      await next(commands)
    } catch (exception) {
      logError(exception)
      process.exitCode = 1
    }
  }
}
