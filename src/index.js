const path = require('path')
const chokidar = require('chokidar')
const readConfig = require('./lib/read-config')
const runCmd = require('./lib/run-cmd')
const log = console.log
const handleEvent = (eventName, commands, {
  baseDir = '.',
  regexp = /<file>/g,
  cmd: cmdOptions
}) => {
  const pathNthArgs = {
    add: 0,
    change: 0,
    unlink: 0,
    addDir: 0,
    unlinkDir: 0,
    raw: 1
  }
  const pathNthArg = pathNthArgs[eventName]

  return (...args) => {
    (function next (commands, i) {
      const commandsCount = commands.length

      if (i < commandsCount) {
        const { cmd, args: commandArgs = [], callNext = 'serial' } = commands[i]
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

        runCmd(cmd, cmdArgs, cmdOptions).then((status) => {
          log(`${cmd} exited with status ${status}`)

          if (serial) {
            next(commands, i + 1)
          }
        })

        if (parallel) {
          next(commands, i + 1)
        }
      }
    })(commands, 0)
  }
}

module.exports = (options) => {
  const {
    cwd: userDirectory = process.cwd(),
    config: configFilename = 'package.json'
  } = Object(options)
  let config = readConfig(configFilename, {
    cwd: userDirectory
  })

  if (configFilename === 'package.json') {
    config = Object(config)['precise-watcher']
  }

  if (config) {
    const { src, chokidar: chokidarConfig } = Object(config)
    const globalChokidarOptions = Object(chokidarConfig)
    const sources = (Array.isArray(src) ? src : [src]).filter(
      (src) => Boolean(src)
    )
    const watchers = sources.map((value) => {
      const { pattern, baseDir, run, on, regexp, chokidar: localChokidarOptions } = Object(value)
      const chokidarOptions = {
        cwd: userDirectory,
        ...globalChokidarOptions,
        ...localChokidarOptions
      }
      const src = Array.isArray(pattern) ? pattern : [pattern]
      const watcher = chokidar.watch(src, chokidarOptions)
      const eventNames = Array.isArray(on) ? on : [on]

      eventNames.forEach((eventName) => {
        if (typeof eventName !== 'string') {
          eventName = 'change'
        }

        watcher.on(eventName, handleEvent(eventName, run, {
          regexp,
          baseDir,
          cmd: { cwd: userDirectory }
        }))
      })

      return watcher
    })

    return watchers
  }

  return null
}
