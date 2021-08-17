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
    const watchers = []

    debug('Reading sources...')
    for await (const value of sources) {
      const { pattern, baseDir, run, on, ignoreFrom = '.gitignore', chokidar: localChokidarOptions } = Object(value)
      const chokidarOptions = {
        cwd: userDirectory,
        ...globalChokidarOptions,
        ...localChokidarOptions
      }
      const patterns = Array.isArray(pattern) ? pattern : [pattern]
      let src = patterns

      if (ignoreFrom) {
        const filepath = path.join(userDirectory, ignoreFrom)
        const sourcesToIgnore = await (ignoreFromFile(filepath).catch(logError))
        // Workaroud:
        // We negate ignored sources because it seems that the "ignore"
        // option in chokidar watches files and THEN ignores them.
        // This way we don't watch sources we don't want and we avoid
        // ENOSPC errors in common scenarios.
        const negatedSourcesToIgnore = sourcesToIgnore.map((src) => {
          if (src[0] === '!') {
            return src.slice(1)
          }

          return '!' + src
        })

        src = src.concat(negatedSourcesToIgnore)
      }

      if (on) {
        const eventNames = Array.isArray(on) ? on : [on]

        debug(`Watching ${src} with the following options: ${JSON.stringify(chokidarOptions)}.`)
        const watcher = chokidar.watch(src, chokidarOptions)

        // We add it instantly to allow instant shutdown.
        debug('Storing watcher.')
        allWatchers.push(watcher)

        debug('Attaching events...')
        for await (const eventName of eventNames) {
          debug(`Attaching "${eventName}" event.`)
          watcher.on(eventName, handleEvent(eventName, run, {
            patterns,
            baseDir,
            cmd: { cwd: userDirectory }
          }))
        }

        watchers.push(watcher)
      } else {
        debug('Handling empty event.')
        await handleEvent(null, run, {
          patterns,
          baseDir,
          cmd: { cwd: userDirectory }
        })()
      }
    }

    debug('Done. Returning chokidar watchers...')
    return watchers
  } else {
    debug('No options found. Returning null...')
  }

  return null
}
