require('./utils/global');

const crypto = require('crypto'),
config = require('./config'),
{ ipcRenderer } = require('electron'),
app = require('electron').remote.app
_ = require('lodash'),
{ ls,ss } = require('./utils/storage'),
utils = require('./utils'),
gz = require('./utils/gzip'),
sp = require('./db/staff_popular'),
fs = require('fs');

  /* @ dev */
const build = require('../../build');

//let x = movie_db.value();

//cl(x[0])
//status_db.get('news_db').assign({hash: ''}).write();




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

        let arr = [],
        str;

        if(stat.url !== res.url){
          status_db.assign({url: res.url}).write();
          cl('status url updated')
        }

        if(stat.yts_db.hash !== res.yts_db.hash){
          arr.push('yts_db');
          ls.set('yts_db_hash', res.yts_db);
          update_cnt++
        }

        if(stat.staff_db.hash !== res.staff_db.hash){
          arr.push('staff_db');
          ls.set('staff_db_hash', res.staff_db);
          update_cnt++
        }

        if(stat.news_db.hash !== res.news_db.hash){
          arr.push('news_db');
          ls.set('news_db_hash', res.news_db);
          update_cnt++
        }

        if(arr.length < 1){
          utils.toast('info', 'db items up to date');
          return window.dispatchEvent(
            new CustomEvent('db-status', {
              detail: 1
            })
          );
        }

        str = 'updating '+ arr.length + ' db item';
        if(arr.length > 1) str+= 's'

        utils.toast('warning', str + '...')

        ipcRenderer.send('update-db', {items: arr, data: res});

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
