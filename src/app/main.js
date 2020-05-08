require('./utils/global');

const config = require('./config'),
{ ipcRenderer } = require('electron'),
fs = require('fs'),
{ ls,ss } = require('./utils/storage'),
enc = require('./utils/enc'),
urls = require('./utils/urls'),
gz = require('./utils/gzip');

if(config.settings.dev){
  //const build = require('../../build');
}


utils.init_hit();

cl(enc.rand(16).toString('hex'))

window.onload = function(evt){
  let doc = evt.target;
  doc.head.remove();

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

  utils.pre(doc, function(err){
    if(err){return ce(err)}

      utils.init(doc, function(err){
        if(err){return utils.toast('danger', err)}

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

            stat = null;

            if(arr.length < 1){
              arr = null;
              utils.toast('info', 'db items up to date');
              return window.dispatchEvent(
                new CustomEvent('db-status', {
                  detail: 1
                })
              );
            } else {
              str = 'updating '+ arr.length + ' db item';
              if(arr.length > 1) str+= 's'

              utils.toast('warning', str + '...')
              str = null;
              ipcRenderer.send('update-db', {items: arr, data: res});
              return;
            }

          })


          window.onload = null;

        },3000)

    })

  })

}
