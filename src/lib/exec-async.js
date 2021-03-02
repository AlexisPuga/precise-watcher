const { promisify } = require('util');
const { exec } = require('child_process')
const execAsync = promisify(exec)

module.exports = execAsync
