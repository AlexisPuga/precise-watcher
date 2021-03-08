const debug = require('debug')
const stop = require('./stop')
const log = console.log
const logError = console.error

module.exports = (watchers) => {
  log('Stopping precise-watcher...')

  stop(watchers).then(() => {
    debug('Setting process.exitCode to 0.')
    process.exitCode = 0
  }).catch((error) => {
    logError(error)
    process.exitCode = 1
  })
}
