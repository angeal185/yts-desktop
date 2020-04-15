require('./utils/global');

const crypto = require('crypto'),
config = require('./config'),
{ ipcRenderer } = require('electron'),
app = require('electron').remote.app
_ = require('lodash'),
utils = require('./utils'),
gz = require('./utils/gzip'),
sp = require('./db/staff_popular'),
fs = require('fs');

  /* @ dev */
const build = require('../../build/build');

//let x = movie_db.value();

//cl(x[0])

ipcRenderer.on('dl-stat', function(event, res){
  cl('dl_hit')
  utils.toast(res.type, res.msg)
})

ipcRenderer.on('dl-img', function(event, res){
  if(img_cache.value().indexOf(res) === -1){
    img_cache.push(res).write();
  }
})

ipcRenderer.on('update-db', function(event, res){
  utils.update_db(res)
})

window.onload = function(evt){
  let doc = evt.target;
  doc.head.remove();
  cl(evt)
  utils.pre(doc, function(err){
    if(err){return ce(err)}
    utils.init(doc);
    let stat = status_db.value();
    setTimeout(function(){
      utils.fetch(stat.url, function(err,res){
        if(err){
          utils.toast('danger', 'unable to check for updates');
          window.dispatchEvent(
            new CustomEvent('db-status', {
              detail: 3
            })
          );
          return ce(err);
        }

        let arr = [];

        if(stat.movie_db.hash !== res.movie_db.hash){
          arr.push('movie_db')
        }
        if(stat.staff_db.hash !== res.staff_db.hash){
          arr.push('staff_db')
        }
        if(stat.news_db.hash !== res.news_db.hash){
          arr.push('news_db')
        }

        if(arr.length < 1){
          return window.dispatchEvent(
            new CustomEvent('db-status', {
              detail: 1
            })
          );
        }

        ipcRenderer.send('update-db', {items: arr, data: res});
        
        //status_db.assign(res).write();

        cl(res)
      })
    },3000)

    window.onload = null;

  });
}

///////


/*

function sha512(data){
  return crypto.createHash('sha512').update(data).digest('hex');
}

fs.writeFileSync('./yts_db.json', js({movies:x}));


clean.img_cache('img',function(err,res){
  if(err){return ce(err)}
  cl(res)
})
*/
