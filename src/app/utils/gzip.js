const zlib = require('zlib'),
config = require('../config'),
{ pipeline } = require('stream'),
fs = require('fs');

const gz = {

  zip: function(url, dest, cb){
    try {
      const i = zlib.createGzip(config.gzip),
      inp = fs.createReadStream(url),
      out = fs.createWriteStream(dest);
      inp.pipe(i).pipe(out);
      return cb(false)
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  unzip: function(url, dest, cb){
    try {
      const i = zlib.createUnzip(config.gzip),
      inp = fs.createReadStream(url),
      out = fs.createWriteStream(dest);
      inp.pipe(i).pipe(out);
      return cb(false)
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  unzipDB: function(url, dest, cb){
    try {
      const i = zlib.createUnzip(config.gzip),
      inp = fs.createReadStream(url),
      out = fs.createWriteStream(dest);
      inp.pipe(i).pipe(out);
      fs.unlink(url, function(err){
        if(err)throw err;
        return cb(false)
      });
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  zipDat: function(data, dest, cb){

    zlib.gzip(data, config.gzip, function(err, res){
      if(err){return cb(err)}
      fs.writeFile(dest, res, function(err){
        if(err){return cb(err)}
        cb(false)
      })
    })

  },
  unzipDat: function(url, cb){
    url = Buffer.from(fs.readFileSync(url));
    zlib.unzip(url, function (err, res) {
       if (err){ return cb(err, null)}
        cb(false, res.toString());
    })
  }
}

module.exports = gz;
