const colors = require('colors/safe')

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: ['dim', 'magenta'],
  prompt: 'grey',
  info: 'bold',
  data: 'italic',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
})

module.exports = (color, msg) => {
  const log = console[/info|warn|debug|error/.test(color) ? color : 'log']
  const styledMsg = colors[color](msg)

  log(styledMsg)
}
