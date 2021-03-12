<p align='right'><a href='https://github.com/standard/standard'><img src='https://cdn.rawgit.com/standard/standard/master/badge.svg' alt='JavaScript Style Guide'/></a></p>
<hr>
<h1 align='left'>Precise Watcher</h1>
<p align='left'><strong>Watch files the precise way.</strong></p>
<hr>
<p align='right'><em><strong><dfn>Precise</dfn></strong>: <q cite='https://www.dictionary.com/browse/precise'>definitely or strictly stated, defined, or fixed</q>.</em></p>

## Contents
1. [Status](#status)
2. [Installation](#installation)
3. [Usage](#usage)
    1. [Posibilities](#posibilities)
    2. [Watch files using NPM scripts](#watch-files-using-npm-scripts)
        1. [Setting options in a configuration file](#setting-options-in-a-configuration-file)
    3. [Watch files using your console](#watch-files-using-your-console)
        1. [Supported options](#supported-options)
    4. [Watch files using js](#watch-files-using-js)
4. [Examples](#examples)
    1. [Run `eslint --fix` on 1 single file, when it changes](#run-eslint---fix-on-1-single-file-when-it-changes)
5. [Supported options](#supported-options)
6. [Credits](#credits)
7. [License](#license)

## Status
![Linux & MacOS CI](https://github.com/AlexisPuga/precise-watcher/workflows/Linux%20%26%20MacOS%20CI/badge.svg)
[![NPM version](https://badge.fury.io/js/precise-watcher.svg)](https://badge.fury.io/js/precise-watcher)

## Installation
Run `npm i precise-watcher` or `yarn add precise-watcher`.

## Usage
Using `precise-watcher` is as simple as adding the following to your `package.json` and running `npm run watch`:
``` js
{
  "precise-watcher": {
    "src": [{
      "pattern": ["**/*"],
      "run": [{
        "cmd": "echo",
        "args": ["<file> changed."]
      }]
    }]
  },
  "scripts": {
    "watch": "precise-watcher"
  },
  "devDependency": {
    "precise-watcher": "git+https://git@github.com/AlexisPuga/precise-watcher.git" // NPM package not available yet until version 1.
  }
}
```
To run it, just modify any file not included in your .gitignore file...

### Posibilities
This tool allows you to:
- Run commands on 1 single file when it changes (by using "&lt;file&gt;" in src.run.args).
- Call as many commands in parallel or serial as you want.
- Watch not only for changes but errors, removals, addings, ...
- Watch multiple sources and run multiple scoped commands.
- Write complex solutions easily.

Once you see what it does and why you need it, you can use it in any of the following ways:
1. [NPM scripts](#watch-files-using-npm-scripts)
2. [CLI](#watch-files-using-your-console)
3. [Javascript](#watch-files-using-js)

### Watch files using NPM scripts
Add `precise-watcher` to your `package.json` file in the following way:
``` js
{
  "precise-watcher": {
    // Your options go here.
  },
  "scripts": {
    // Replace "watch" with whatever you want.
    "watch": "precise-watcher"
  }
}
```
Then, run the NPM script (`npm run watch` in this case) and press `ctrl + c`, as normal, to stop watching files.

Addittionaly, you can remove the options from your `package.json` file and use a config. file to set your options:

#### Setting options in a configuration file
[Create a config. file](#create-a-config-file) called ` precise-watcher.config.js ` (for example), and reference it using the ` --config ` option in the command you added before.

``` js
// precise-watcher.config.js
module.exports = {
  // Your options go here.
}
```
``` json
{
  "scripts": {
    "watch": "precise-watcher --config precise-watcher.config.js"
  }
}
```
As you can see, you no longer need the `precise-watcher` property anymore.

### Watch files using your console
To start watching file changes:
1. [Create a config file](#create-a-config-file) called `precise-watcher.config.js`, for example.
2. Run `./node_modules/.bin/precise-watcher --config precise-watcher.config.js`.

To stop watching file changes:
- Press `ctrl + c`.

#### Supported options
Below are a list of options that you can use with `precise-watcher`:

Option   | Defaults      | Description 
:------- | :------------ | :----------
--cwd    | process.cwd() | Directory for chokidar, config file, and child_process.spawn().
--config | package.json  | Path to your config. file, relative to cwd.

### Watch files using js
Should be as easy as:
``` js
const { start, stop, shutdown } = require('precise-watcher')

// Resolves to an array of chokidar.watch() instances:
start().then(async (watchers) => {
  // To remove some watchers:
  // Resolves to an array of each watcher.close() result.
  const closedWatchers = await stop(watchers)
  // To remove all watchers:
  const allClosedWatchers = await stop()

  // To exit:
  shutdow() // Calls stop() internally.
}) // ...
```
With async/await:
``` js
const { start, stop, shutdown } = require('precise-watcher')

(async () => {
  try {
    const watchers = await start()
    const closedWatchers = await stop(watchers)
    const allClosedWatchers = await stop()

    shutdown()
  } catch (error) {
    // Log error...
  }
})()
```

## Examples
If you need more inspiration, you can check out these examples:

### Run `eslint --fix` on 1 single file, when it changes
1. Run `npm install eslint --save-dev`.
2. Add the following to your `package.json`:
``` json
{
  "precise-watcher": {
    "src": [{
      "pattern": ["**/*.js"],
      "run": [{
        "cmd": "echo",
        "args": [
          "Running eslint <file> --fix"
        ],
        "callNext": "parallel"
      }, {
        "cmd": "eslint",
        "args": [
          "<file>",
          "--fix"
        ],
        "callNext": "serial"
      }, {
        "cmd": "echo",
        "args": ["Done"]
      }]
    }]
  },
  "scripts": {
    "watch": "precise-watcher"
  }
}
```
3. Run `npm run watch`.
4. Modify any .js file.

## Supported options
``` js
{
  /** @type {?object} (Optional) chokidar options that will apply to all sources. Defaults to the following, as of chokidar@3.5: */
  "chokidar": {
    "persistent": true,
    // Concatenated with src.ignoreFrom sources.
    "ignored": [],
    "ignoreInitial": false,
    "followSymlinks": false,
    // Defaults to value passed via --cwd, "cwd" param in src/start.js' main function, or process.cwd()
    "cwd": "",
    "disableGlobbing": false,
    "usePolling": false,
    "useFsEvents": true,
    "alwaysStat": false,
    "depth": undefined,
    "awaitWriteFinish": false,
    "ignorePermissionErrors": false,
    "atomic": true
  },
  /** @type {object|object[]} Source(s) to watch. */
  "src": [{
    /** @type {string|RegExp|string[]|RegExp[]} Pattern(s) to watch. */
    "pattern": [],
    /** @type {?string} (Optional) Set "<file>" replacement relative to this value. Basically: path.relative(baseDir, watchedFile). Useful to convert /some/path/file to /file, for example */
    "baseDir": "",
    /** @type {?string} A path to a .gitignore-like file to ignore sources matched by src.pattern. Relative to cwd. */
    "ignoreFrom": ".gitignore",
    /** @type {object|object[]} An array of commands. */
    "run": [{
      /** @type {?string} The command to run. */
      "cmd": "",
      /**
       * @type {?string[]} List of arguments for cmd.
       *
       * Use "<file>" to replace it with the changed filepath if the event
       * supports it, or set each src.pattern value as default (and call
       * this command in parallel multiple times with each given pattern).
       */
      "args": [],
      /** @type {?string} Any of "serial" or "parallel". Defaults to "serial". */
      "callNext": "serial"
    }],
    /** @see https://github.com/paulmillr/chokidar */
    /** @type {?string[]} One or many chokidar events: "add", "unlink", "addDir", "unlinkDir", "error", "ready", "raw". Defaults to "change". */
    "on": [],
    /** @see https://github.com/paulmillr/chokidar */
    /** @type {?object} Chokidar options that will apply to these sources only. Merged with global "chokidar" options. */
    "chokidar": {}
  }]
}
```
## Credits
Thanks to <a href='https://github.com/paulmillr/chokidar'>Chokidar</a>'s author and contributors and this project's contributors.

## License
This project is <a href='https://github.com/AlexisPuga/precise-watcher/blob/master/LICENSE'>MIT Licensed</a>.
