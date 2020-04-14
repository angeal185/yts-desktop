var Client = require('bittorrent-tracker');

const scrap = {
  mov: function(tracker, hash_arr, cb){
    Client.scrape({
       announce: tracker,
       infoHash: hash_arr
     },
     function (err, res) {
       if(err || !res){
         return cb('torrent info unavailable at this time')
       }

       let arr = [];
       for (let i in res) {
         delete res[i].announce;
         arr.push(res[i])
       }
       cb(false, arr)
    })
  }
}

module.exports = scrap;
