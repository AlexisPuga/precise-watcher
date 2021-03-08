const stop = require('./stop')
const logError = console.error

module.exports = () => {
  stop().then(() => {
    process.exit(0)
  }).catch((error) => {
    logError(error)
    process.exit(1)
  })
}
