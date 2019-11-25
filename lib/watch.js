const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const mcjson = require('mcjson')


const parse = require('./parse.js');
const compile = require('./compile.js');
const consoleStyles = require('./consoleStyles.js');
const mcfunctionCredits = require('../assets/mcfunctionCredits.js');

module.exports = (args, options = {fullError: false, generateJSON: false, noErrors: true, noInitial: false, noOutput: false}) => {
  const {fullError, generateJSON, noErrors, noInitial, noWhitelines, noCredits, noOutput} = options;
  let inputPath = args[0] || './';

  const watcher = chokidar.watch(inputPath, {persistent: true});
  watcher.on('ready', () => {
    console.log('\nWatching for changes...\t\t\t(Ctrl-C to stop watching)\n\n');
    if(noInitial === false) compile(args, {...options, noOutput: true});
    watcher.on('all', (event, file) => {
      if(["change", "add"].includes(event)) {
        if(path.extname(file) !== ".mccode") return;

        compile([file], options, () => {
          console.log('\nPress Ctrl-C to stop watching...');
        })
      }



    });
  });
}
