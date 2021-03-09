const path = require('path')
const debug = require('debug')('precise-watcher')
const chokidar = require('chokidar')
const readConfig = require('./lib/read-config')
const handleEvent = require('./handle-event')
const allWatchers = require('./watchers')
const ignoreFromFile = require('./lib/ignore-from-file')
const logError = console.error

module.exports = async (options) => {
  const {
    cwd: userDirectory = process.cwd(),
    config: configFile = 'package.json'
  } = Object(options)
  const configFilename = path.basename(configFile)
  debug(`Setting cwd to ${userDirectory}.`)
  debug(`Setting config to ${configFile}.`)

  debug(`Reading ${path.join(userDirectory, configFile)}.`)
  let config = readConfig(configFile, {
    cwd: userDirectory
  })

  // @FIXME Read package.json from other locations.
  // ../package.json won't work
  if (configFilename === 'package.json') {
    debug('Reading "precise-watcher" property from package.json.')
    config = Object(config)['precise-watcher']
  }

  if (config) {
    debug('Reading options...')
    const { src, chokidar: chokidarConfig } = Object(config)
    const globalChokidarOptions = Object(chokidarConfig)
    const sources = (Array.isArray(src) ? src : [src]).filter(
      (src) => Boolean(src)
    )
    debug('Reading sources...')
    const watchers = sources.map(async (value) => {
      const { pattern, baseDir, run, on, ignoreFrom = '.gitignore', chokidar: localChokidarOptions } = Object(value)
      const chokidarOptions = {
        cwd: userDirectory,
        ...globalChokidarOptions,
        ...localChokidarOptions
      }
      const src = Array.isArray(pattern) ? pattern : [pattern]
      const eventNames = Array.isArray(on) ? on : [on]

      if (ignoreFrom) {
        const filepath = path.join(userDirectory, ignoreFrom)
        const sourcesToIgnore = await (ignoreFromFile(filepath).catch(logError))
        const ignoredSources = ((ignoredSources) => {
          if (!Array.isArray(ignoredSources)) {
            ignoredSources = (ignoredSources ? [ignoredSources] : [])
          }

          return ignoredSources
        })(chokidarOptions.ignored)

        chokidarOptions.ignored = ignoredSources.concat(sourcesToIgnore)
      }

      debug(`Watching ${src} with the following options: ${JSON.stringify(chokidarOptions)}.`)
      const watcher = chokidar.watch(src, chokidarOptions)

      // We add it instantly to allow instant shutdown.
      debug('Storing watcher.')
      allWatchers.push(watcher)

      debug('Attaching events...')
      eventNames.forEach((eventName) => {
        if (typeof eventName !== 'string') {
          eventName = 'change'
        }

        debug(`Attaching "${eventName}" event.`)
        watcher.on(eventName, handleEvent(eventName, run, {
          baseDir,
          cmd: { cwd: userDirectory }
        }))
      })

      return watcher
    })

    debug('Done. Returning chokidar watchers...')
    return await Promise.all(watchers)
  } else {
    debug('No options found. Returning null...')
  }

  return null
}
