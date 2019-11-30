
const fs = require('fs');
const path = require('path');

const mcjson = require('mcjson')


const parse = require('./parse.js')
const consoleStyles = require('./consoleStyles.js');
const mcfunctionCredits = require('../assets/mcfunctionCredits.js');

module.exports = (args, options = {fullError: false, generateJSON: false, noErrors: false, noOutput: false, noWhitelines: false, noCredits: false}, callback = () => {}) => {
  const {fullError, generateJSON, noErrors, noOutput, noWhitelines, noCredits, respectJsonPath} = options;
  let inputPath = args[0] || './';
  const fullPath = path.resolve(inputPath);
  function modPath(p, changeDir) {
    p  = path.resolve(p);
    let dir = p.split(path.sep).reverse();
    let newPath = [];
    let targetIndex;
    for(let i = 0; i < dir.length; i++) {
      if(dir[i].toLowerCase() == "mccode" && dir[i + 2].toLowerCase() == "data") targetIndex = i;
    }
    for(let i in dir) {
      if(i == targetIndex) newPath.unshift(changeDir);
      else if(i  == targetIndex - 1 && ["functions", "recipes", "tags", "advancements"].includes(dir[i].toLowerCase()) && !(respectJsonPath && changeDir === "mcjson")) continue;
      else newPath.unshift(dir[i]);
    }
    if(targetIndex) return newPath.join(path.sep)
    return p
  }

  fs.access(inputPath, err => {
    if(err) return console.log(consoleStyles.FgRed + 'Target does not exist' + consoleStyles.Reset);

    let inputFiles = [];
    let outputFiles = [];
    let outputErrors = [];

    let count = 0;
    readDir(inputPath, () => {
      let count_ = inputFiles.length;
      for(let file of inputFiles) {
        fs.readFile(file, 'utf8', (err, raw) => {
          if(err) {
            count_--;
            return console.log(consoleStyles.FgRed + 'Error while reading file: ' + file + consoleStyles.Reset);
          }
          let data = parse(raw, options);

          if(data.isError) {
            count_--;
            return console.log(consoleStyles.FgRed + 'Invalid syntax in file: ' + file + ' at index ' + data.index + '\n' + data.error + consoleStyles.Reset);
          }

          let output = [];
          if(!data.result) data.result = [];
          for(let jsonFile of data.result) {
            const newFilePath = path.relative('./', modPath(file.replace(new RegExp(path.extname(file) + '$'), '.mcfunction'), "functions"));
            const newFile = Object.create(jsonFile);
            newFile.type = newFile.type || 'mcfunction'
            if(newFile.path) {
              newFile.path = path.join(newFilePath.replace(new RegExp(path.win32.basename(newFilePath) + '$'), ''), newFile.path)
            } else {
              newFile.path = newFilePath;
            }

            const newFileData = mcjson.generate(newFile, file, {fullError: fullError});
            if(newFileData) {
              if(newFile.type == "mcfunction" && noCredits == false) output.push({type: newFile.type, ...newFileData, content: mcfunctionCredits(file, newFile.path) + newFileData.content});
              else output.push({type: newFile.type, ...newFileData});
            }
          }


          if(generateJSON) {
            output.push({type: "mcjson", path: path.relative('./', modPath(file, "mcjson").replace(new RegExp(path.extname(file) + '$'), '.json')), content: JSON.stringify(data.result, null, "\t")})
          }

          let count__ = output.length;
          for(let fileData of output) {

            fs.mkdir(path.dirname(fileData.path), {recursive: true}, err => {
              if(err) {
                count__--;
                return console.log(consoleStyles.FgRed + 'Error while creating folder ' + path.dirname(fileData.path) + consoleStyles.Reset);
              }

              fs.writeFile(path.join('./', fileData.path), fileData.content, err => {
                if(err) {
                  count__--;
                  return console.log(consoleStyles.FgRed + 'Error while creating file:  ' + path.normalize(fileData.path) + consoleStyles.Reset);
                }

                outputFiles.push({path: fileData.path, type: fileData.type});
                count__--;
                if(count__ === 0) count_--;
                if(count_ === 0 && count__ === 0) {
                  if(noOutput === false) console.log('\n');
                  if(noOutput === false) ["mcfunction", "mcjson"].forEach(e => {
                    outputFiles.filter(ee => ee.type == e).forEach(ee => {
                      console.log(consoleStyles.FgCyan + 'Generated\t' + consoleStyles.Bright + ee.type.padEnd(15) + consoleStyles.Reset + '\t' + consoleStyles.FgYellow + path.normalize(ee.path) + consoleStyles.Reset);
                    })
                  })

                  if(noOutput === false) console.log('');
                  if(outputErrors.length < 1) {
                    if(noOutput === false) console.log(consoleStyles.FgGreen + 'Read ' + inputFiles.length + ` file${inputFiles.length === 1 ? '' : 's'} and compiled successfully` + consoleStyles.Reset);
                  }
                  else if(!noErrors) outputErrors.forEach(e => console.log(e));
                  else console.log(consoleStyles.FgRed + 'Read ' + inputFiles.length + ` file${inputFiles.length === 1 ? '' : 's'} but didn't compile successfully` + consoleStyles.Reset);
                  callback();
                }

              });
            });
          }


        });
      }

    });




    function readDir(p, callback) {
      count++
      fs.lstat(p, (err, stats) => {
        if(err) return console.log(consoleStyles.FgRed + 'Can\'t get stats of path: ' + p + consoleStyles.Reset);

        if(stats.isFile()) {
          if(path.extname(p) == ".mccode") {
            inputFiles.push(p);
          }

          count--;
          if(count === 0) callback();
        } else if(stats.isDirectory()) {
          fs.readdir(p, (err, files) => {
            if(err) console.log(consoleStyles.FgRed + 'Error while reading directory: ' + p + consoleStyles.Reset);

            for(let file of files) {
              readDir(path.join(p, file), callback);
            }

            count--;
            if(count === 0) callback();
          })
        }

      });
    }


  });
}
