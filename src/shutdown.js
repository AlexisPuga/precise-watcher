const stop = require('./stop')
const log = require('./lib/log')

module.exports = () => {
  stop().then(() => {
    process.exit(0)
  }).catch((error) => {
    log('error', error)
    process.exit(1)
  })
}
