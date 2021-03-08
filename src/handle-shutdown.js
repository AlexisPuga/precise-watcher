const shutdown = require('./shutdown')
const debug = require('debug')('precise-watcher')
const chokidarWatchers = []
const handleShutdown = () => {
  debug('Exiting from precise-watcher...')
  shutdown(chokidarWatchers)
}

module.exports = {
  chokidarWatchers,
  run: handleShutdown
}
