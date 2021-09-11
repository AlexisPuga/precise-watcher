const debug = require('debug')('precise-watcher')
const allWatchers = require('./watchers')
const log = require('./lib/log')
const removeAllWatchers = async (watchers) => await Promise.all(
  watchers.map(async (watcher) => await watcher.close())
)

module.exports = async (watchers) => {
  log('info', '\nStopping precise-watcher')

  if (!watchers) {
    debug('Removing all watchers.')
    watchers = allWatchers
  }

  return await removeAllWatchers(watchers)
}
