const removeAllWatchers = async (watchers) => await Promise.all(
  watchers.map(async (watcher) => await watcher.close())
)

module.exports = async (watchers) => {
  return await removeAllWatchers(watchers)
}
