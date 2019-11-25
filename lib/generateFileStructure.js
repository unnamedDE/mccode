
const fs = require('fs');
const path = require('path');

const consoleStyles = require('./consoleStyles.js');

module.exports = generate;
function generate(obj, p, options = {logs: true, fullError: false}) {
  const {logs, fullError} = options;
  if(obj == null) {
    fs.mkdir(p, {recursive: true}, err => {
      if(err && fullError) return console.error(err);
      if(err) return console.log(consoleStyles.FgRed + 'Error while creating folder ' + p + consoleStyles.Reset);
      if(logs) console.log(consoleStyles.FgCyan + 'Created\t\t\t' + consoleStyles.FgYellow + p + consoleStyles.Reset);
    });
  }
  else {
    for(let [key, value] of Object.entries(obj)) {
      if(key.split('.').length <= 1) generate(obj[key], path.join(p, key));
      else {
        const pp = path.join(p, key);
        fs.mkdir(path.dirname(pp), {recursive: true}, err => {
          if(err && fullError) return console.error(err);
          if(err) return console.log(consoleStyles.FgRed + 'Error while creating folder ' + path.dirname(pp) + consoleStyles.Reset);

          fs.writeFile('./' + pp, value, err => {
            if(err && fullError) return console.error(err);
            if(err) return console.log(consoleStyles.FgRed + 'Error while creating file:  ' + pp + consoleStyles.Reset);
            if(logs) console.log(consoleStyles.FgCyan + 'Created\t\t\t' + consoleStyles.FgYellow + pp + consoleStyles.Reset);
          });
        });
      }
    }
  }

}
