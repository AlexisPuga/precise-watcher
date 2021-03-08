const debug = require('debug')('precise-watcher')
const stop = require('./stop')
const allWatchers = []
const log = console.log
const logError = console.error
const handleShutdown = (watchers) => {
  log('Stopping precise-watcher...')

  stop(watchers).then(() => {
    debug('Setting process.exitCode to 0.')
    process.exitCode = 0
  }).catch((error) => {
    logError(error)
    process.exitCode = 1
  })
}

module.exports = {
  allWatchers,
  run: handleShutdown
}
