const parseGitignore = require('parse-gitignore')
const { readFile } = require('fs')
const { promisify } = require('util')
const readFileAsync = promisify(readFile)

module.exports = async (filepath) => {
  const file = await readFileAsync(filepath)
  const parsedFile = await parseGitignore(file)

  return parsedFile
}
