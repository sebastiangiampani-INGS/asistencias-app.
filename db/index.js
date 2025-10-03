const config = require('../config');
let impl;

if (config.storage.backend === 'MYSQL') {
  impl = require('./mysql');
  console.log('[DB] Usando MySQL');
} else {
  impl = require('./sheets');
  console.log('[DB] Usando Google Sheets');
}

module.exports = impl;
