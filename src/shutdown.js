const debug = require('debug')('precise-watcher')
const stop = require('./stop')
const logError = console.error

module.exports = (watchers) => {
  stop(watchers).then(() => {
    debug('Setting process.exitCode to 0.')
    process.exitCode = 0
  }).catch((error) => {
    logError(error)
    process.exitCode = 1
  })
}
