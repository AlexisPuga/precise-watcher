const colors = require('colors/safe')

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
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
