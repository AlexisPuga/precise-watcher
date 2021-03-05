const stop = require('./stop')
const log = console.log
const logError = console.error

module.exports = (watchers) => {
  log('Stopping precise-watcher...')

  stop(watchers).then(() => {
    process.exitCode = 0
  }).catch((error) => {
    logError(error)
    process.exitCode = 1
  })
}
