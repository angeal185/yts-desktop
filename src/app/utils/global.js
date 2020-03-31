let dir = __dirname.split('/');
dir = dir.slice(0,-2);
global.base_dir = dir.join('/');

const low = require('lowdb'),
FileSync = require('lowdb/adapters/FileSync'),
adapter = new FileSync(base_dir +'/app/db/db.json'),
config = require('../config');

//global db
global.db = low(adapter)

db.defaults({
  history:[],
  saved: []
}).write();

global.his_db = db.get('history');
global.save_db = db.get('saved');

//global vars
global.cl = console.log;
global.ce = console.error;
global.js = JSON.stringify;
global.jp = JSON.parse;
global.LS = localStorage;
global.SS = sessionStorage;

global.headers = {
  json_cors: {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip',
    'Cache-Control': 'max-age='+ config.settings.cors_cache_json,
    'Sec-Fetch-Dest': 'object',
    'Sec-Fetch-mode': 'cors',
    'Sec-Fetch-Site': 'cross-site'
  },
  html_cors: {
    'Content-Type': 'text/html',
    'Accept-Encoding': 'gzip',
    'Cache-Control': 'max-age='+ config.settings.cors_cache_html,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-mode': 'cors',
    'Sec-Fetch-Site': 'cross-site'
  }
}
