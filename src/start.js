const chokidar = require('chokidar')
const readConfig = require('./lib/read-config')
const handleEvent = require('./handle-event')
const shutdown = require('./shutdown')
const allWatchers = []
const handleShutdown = () => {
  shutdown(allWatchers)
}
const handleSignal = () => {
  process.exitCode = 0
}

process.on('SIGINT', handleSignal)
process.on('SIGTERM', handleSignal)
process.on('exit', handleShutdown)

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
      const { pattern, baseDir, run, on, chokidar: localChokidarOptions } = Object(value)
      const chokidarOptions = {
        cwd: userDirectory,
        ...globalChokidarOptions,
        ...localChokidarOptions
      }
      const src = Array.isArray(pattern) ? pattern : [pattern]
      const eventNames = Array.isArray(on) ? on : [on]
      const watcher = chokidar.watch(src, chokidarOptions)

      // We add it instantly to allow instant shutdown.
      allWatchers.push(watcher)

      eventNames.forEach((eventName) => {
        if (typeof eventName !== 'string') {
          eventName = 'change'
        }

        watcher.on(eventName, handleEvent(eventName, run, {
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
