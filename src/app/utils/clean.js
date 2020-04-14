const fs = require('fs'),
glob = require('glob');

const clean = {
  cache_cache: function(sel, cb){
    glob(base_dir + '/app/cache/'+ sel +'/**', function (err, items) {
      if(err){return cb(err)}
      if(items.length > 0){
        for (let i = 0; i < items.length; i++) {
          fs.unlinkSync(items[i]);
        }
      }
      db.set(sel +'_cache', []).write();
      cb(false, sel+ ' cache emptied')
    })
  }
}

module.exports = clean;
