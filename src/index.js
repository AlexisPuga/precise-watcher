const readConfig = require('./lib/read-config')

module.exports = (options) => {
  const {
    cwd,
    config: configFilename = 'package.json',
  } = Object(options);
  let config = readConfig(configFilename, {cwd})

  if (configFilename === 'package.json') {
    config = Object(config)['precise-watcher']
  }

  if (!config) {
    return false
  }

  return true
}
