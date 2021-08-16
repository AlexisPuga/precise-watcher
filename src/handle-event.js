const path = require('path')
const debug = require('debug')('precise-watcher')
const runCmd = require('./lib/run-cmd')
const log = console.log
const logError = console.error
const normalizeEventArgs = (eventName, args) => {
  const getArg = (chokidarArgsIndexes) => args[chokidarArgsIndexes[eventName]]
  const path = getArg({
    add: 0,
    change: 0,
    unlink: 0,
    addDir: 0,
    unlinkDir: 0,
    raw: 1
  })
  const stats = getArg({
    add: 1,
    addDir: 1,
    change: 1
  })
  const error = getArg({
    error: 0
  })
  const event = getArg({
    raw: 0
  })
  const details = getArg({
    raw: 2
  })

  return { path, stats, error, event, details }
}
const replaceTokensInCommandArg = (cmdArg, { path: pathArg }, {
  baseDir,
  defaults = {}
}) => {
  return cmdArg.replace(/<file>/g, () => {
    if (!pathArg) {
      debug('The path argument is empty. Using default value.')
      pathArg = defaults.path
    }

    const filepath = path.relative(baseDir, pathArg)

    debug(`Replacing <file> with ${filepath}`)
    return filepath
  })
}
const replaceTokensInCommandArgs = (commandArgs, eventArgs, options) => {
  return commandArgs.map(
    (cmdArg) => replaceTokensInCommandArg(cmdArg, eventArgs, options)
  )
}

module.exports = (eventName, commands, {
  patterns,
  baseDir = '.',
  cmd: cmdOptions
}) => async (...args) => {
  const eventArgs = normalizeEventArgs(eventName, args)
  const next = async (commands, i = 0) => await new Promise((resolve, reject) => {
    const command = commands[i]

    if (command) {
      const { cmd, beforeRun, args: commandArgs = [], callNext = 'serial' } = command
      const serial = callNext === 'serial'
      const parallel = callNext === 'parallel'
      const cmdArgs = replaceTokensInCommandArgs(commandArgs, eventArgs, {
        baseDir,
        defaults: {
          get path () {
            const patternIndex = command._patternIndex || 0
            const currentPattern = patterns[patternIndex]
            const nextPattern = patterns[patternIndex + 1]

            // Clone the current command and call it on the next
            // iteration with new patterns:
            if (nextPattern) {
              const commandClone = { ...command }

              // @TEST_ME
              // Run the next command as required (in serial or parallel).
              commandClone.callNext = command.callNext
              // But call this in parallel.
              command.callNext = 'parallel'

              commandClone._patternIndex = patternIndex + 1
              commands.splice(i + 1, 0, commandClone)
            }

            return currentPattern
          }
        }
      })

      if (typeof beforeRun === 'function') {
        // Command related info:
        const cmdInfo = {
          cmd: cmd,
          args: cmdArgs,
          options: cmdOptions
        }
        // Chokidar related info:
        const eventInfo = {
          name: eventName,
          args: eventArgs
        }
        // Any other info:
        const context = {
          callNext,
          patterns,
          baseDir,
          commands
        }

        debug('Calling beforeRun.call(context, cmdInfo, eventInfo).')
        const keepRunning = beforeRun.call(context, cmdInfo, eventInfo)

        if (keepRunning === false) {
          debug(`Skipping ${cmd} due return value of beforeRun (${keepRunning}).`)
          next(commands, i + 1).catch(reject)

          return
        }
      }

      debug(`Running ${cmd}, args: ${JSON.stringify(cmdArgs)}, options: ${JSON.stringify(cmdOptions)}.`)
      runCmd(cmd, cmdArgs, cmdOptions).then(async (status) => {
        log(`${cmd} exited with status ${status}`)

        if (serial) {
          debug('Calling next command in serial...')
          await next(commands, i + 1)
        } else {
          debug('Skipping "serial" call.')
        }
      }).catch(reject)

      if (parallel) {
        debug('Calling next command in parallel...')
        next(commands, i + 1).catch(reject)
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
