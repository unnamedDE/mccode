
const path = require('path');
const fs = require('fs');

module.exports = (source, dest) => {
  return (() =>
`#######
# Compiled from ` + source +
`
# to ` + dest +
`
#
# Compiled with MCCode v${JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).version} made by unnamedDE (https://unnamedDE.tk)
######\n\n`
)()
}
