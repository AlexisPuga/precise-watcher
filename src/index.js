const path = require('path')
const chokidar = require('chokidar')
const readConfig = require('./lib/read-config')
const execAsync = require('./lib/exec-async')
const handleEvent = (eventName, command, {
  regexp = /<file>/g,
  cmd: execAsyncOptions
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

  return async (...args) => {
    const path = args[pathNthArg]
    const cmd = command.replace(regexp, path)

    await execAsync(cmd, execAsyncOptions)
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

    sources.forEach((value) => {
      const { pattern, run, on, regexp, chokidar: localChokidarOptions } = Object(value)
      const chokidarOptions = {
        ...globalChokidarOptions,
        ...localChokidarOptions
      }
      const src = (Array.isArray(pattern) ? pattern : [pattern]).map(
        (src) => path.join(userDirectory, src)
      )
      const watcher = chokidar.watch(src, chokidarOptions)
      const eventNames = Array.isArray(on) ? on : [on]

      eventNames.forEach((eventName) => {
        if (typeof eventName !== 'string') {
          eventName = 'change'
        }

        watcher.on(eventName, handleEvent(eventName, run, {
          regexp,
          cmd: { cwd: userDirectory }
        }))
      })
    })

    return true
  }

  return false
}
