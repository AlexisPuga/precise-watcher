const chokidar = require('chokidar')
const readConfig = require('./lib/read-config')
const handleEvent = require('./handle-event')

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
      const watcher = chokidar.watch(src, chokidarOptions)
      const eventNames = Array.isArray(on) ? on : [on]

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
