const colors = require('colors/safe')

module.exports = (color, msg) => console.log(colors[color](msg))
