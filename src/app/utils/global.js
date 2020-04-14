let dir = __dirname.split('/');
dir = dir.slice(0,-2);
global.base_dir = dir.join('/');

global.js = JSON.stringify;
global.jp = JSON.parse;

const config = require('../config'),
low = require('lowdb'),
FileSync = require('lowdb/adapters/FileSync'),
adapter = new FileSync(base_dir +'/app/db/db.json', {
  serialize: function(obj){
    return js(obj)
  },
  deserialize: function(data){
    return jp(data)
  }
}),
yts_adapter = new FileSync(base_dir +'/app/db/yts_db.json', {
  serialize: function(obj){
    return js(obj)
  },
  deserialize: function(data){
    return jp(data)
  }
});

global.db = low(adapter)
global.yts_db = low(yts_adapter)

db.defaults({
//  history:[],
  saved: [],
  img_cache: [],
  subs_cache: []
}).write();

yts_db.defaults({
  movies:[],
  search:[],
  status: []
}).write();

global.movie_db = yts_db.get('movies');
global.status_db = yts_db.get('status');
global.search_db = yts_db.get('search');
global.his_db = db.get('history');
global.save_db = db.get('saved');
global.img_cache = db.get('img_cache');
global.subs_cache = db.get('subs_cache');
global.scrap_cnt = 0;

//global vars
global.cl = console.log;
global.ce = console.error;
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
