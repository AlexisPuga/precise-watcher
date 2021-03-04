const { spawn } = require('child_process')
const log = console.log
const logError = console.error

module.exports = async (cmd, args, options) => await new Promise((resolve, reject) => {
  const child = spawn(cmd, args, options)
  const { stdout, stderr } = child

  log(`Running ${cmd}`)

  stdout.on('data', (data) => {
    log(data.toString())
  })

  stderr.on('data', (data) => {
    logError(data.toString())
  })

  child.on('error', (error) => {
    reject(error)
  })

  child.on('exit', (status) => {
    resolve(status)
  })
})
