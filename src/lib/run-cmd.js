const { spawn } = require('child_process')
const log = require('./log')

module.exports = async (cmd, args, options) => await new Promise((resolve, reject) => {
  const child = spawn(cmd, args, options)
  const { stdout, stderr } = child

  log('info', `\nRunning ${cmd}`)
  log('verbose', `▸ ${cmd} ${args.join(' ')}`)

  stdout.on('data', (data) => {
    log('data', data.toString())
  })

  stderr.on('data', (data) => {
    log('error', data.toString())
  })

  child.on('error', (error) => {
    reject(error)
  })

  child.on('exit', (status) => {
    resolve(status)
  })
})
