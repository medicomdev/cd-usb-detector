const os = require('os');
const mac = require('./mac');
const win = require('./win');

let exportable = null;
switch(os.platform()) {
    case 'win32':
        exportable = win;
        break;
    case 'darwin':
        exportable = mac;
        break;
}

module.exports = exportable;