const path = require('path')

module.exports = (filename, { cwd }) => {
  const userDirectory = cwd || process.cwd()
  const filepath = path.resolve(userDirectory, filename)

  return require(filepath)
}
