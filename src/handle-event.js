const path = require('path')
const debug = require('debug')('precise-watcher')
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
          return cmdArg.replace(/<file>/g, () => {
            const pathArg = args[pathNthArg]
            const pathArgRelativeToBaseDir = path.relative(baseDir, pathArg)

            debug(`Replacing <file> with ${pathArgRelativeToBaseDir}`)
            return pathArgRelativeToBaseDir
          })
        })

        debug(`Running ${cmd}, args: ${JSON.stringify(cmdArgs)}, options: ${JSON.stringify(cmdOptions)}.`)
        runCmd(cmd, cmdArgs, cmdOptions).then(async (status) => {
          log(`${cmd} exited with status ${status}`)

          if (serial) {
            debug('Calling next command in serial...')
            await next(commands)
          } else {
            debug('Skipping "serial" call.')
          }
        }).catch(reject)

        if (parallel) {
          debug('Calling next command in parallel...')
          next(commands).catch(reject)
        }

        if (!serial && !parallel) {
          reject(new TypeError(`src.callNext value (${callNext}) is invalid.`))
        }
      } else {
        debug('No commands found. Resolving...')
        resolve()
      }
    })

    try {
      debug('Running commands...')
      await next(commands)
    } catch (exception) {
      logError(exception)
      process.exitCode = 1
    }
  }
}
