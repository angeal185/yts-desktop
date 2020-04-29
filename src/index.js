const { app, session, BrowserWindow, ipcMain, Tray, nativeImage } = require('electron'),
path = require('path'),
url = require('url'),
urls = require('./app/utils/urls'),
gz = require('./app/utils/gzip'),
config = require('./app/config'),
ico = require('./app/data/img').ico;

config.main_cnf.icon = nativeImage.createFromBuffer(
  Buffer.from(ico, 'base64')
);

config.main_cnf.webPreferences.preload = __dirname + "/app/main.js";


//app.allowRendererProcessReuse = true;


function init(){

  const win = new BrowserWindow(config.main_cnf);

  let dest = url.format({
    protocol: 'file',
    slashes: true,
    pathname: path.join(__dirname, config.base_file)
  })

  win.loadURL(
    url.format({
      protocol: 'file',
      slashes: true,
      pathname: path.join(__dirname, config.base_file)
    }),
    {
      extraHeaders: 'Content-Type:text/html;charset=utf-8;'
    }
  );

  if(config.proxy.enabled && !config.bl){
    config.proxy.settings.proxyBypassRules = '"ipify.org", "imdb.com", "intensedebate.com",  "gravatar.com", "rawgit.org", "rottentomatoes.com"';
    win.webContents.session.setProxy(config.proxy.settings)
  }


  if(config.settings.dev){
    win.webContents.openDevTools();
  }

  ipcMain.on('dl-img', function(event, arg) {
    win.webContents.session.downloadURL(arg)
  })

  ipcMain.on('update-db', function(event, obj) {
    for (let i = 0; i < obj.items.length; i++) {
      win.webContents.session.downloadURL(obj.data[obj.items[i]].url)
    }
  })

  win.webContents.session.on('will-download', function(event, item, webContents){
    let fname = item.getFilename(),
    ttl, db_gz;
    console.log('dl...')

    if(path.extname(fname) !== '.json'){

      if(path.extname(fname) === '.torrent'){
        item.setSavePath([config.settings.downloads, 'torrent', fname].join('/'))
      } else if(path.extname(fname) === '.zip'){
        item.setSavePath([config.settings.downloads, 'subs', fname].join('/'))
      } else if(path.extname(fname) === '.jpg'){
        ttl = item.getURL().split('/');
        ttl = ttl.slice(0,-1).pop() + '.jpg';
        item.setSavePath([__dirname, 'app/cache/img', ttl].join('/'))
      } else if(path.extname(fname) === '.gz'){
        db_gz = [__dirname, urls.dbcache, fname].join('/');
        item.setSavePath(db_gz)
      }

      item.on('updated', function(event, state){
        if (state === 'interrupted'){
          console.log('Download is interrupted but can be resumed')
        } else if (state === 'progressing'){
          if (item.isPaused()) {
            console.log('Download is paused')
          } else {
            console.log(`Received bytes: ${item.getReceivedBytes()}`)
          }
        }
      })

      item.once('done', function(event, state){

        if(path.extname(fname) === '.jpg'){
          win.webContents.send('dl-img', ttl.slice(0,-4))
        } else if(path.extname(fname) === '.gz'){
          fname = fname.slice(0,-3);
          let obj = {
            success: false,
            type: 'danger',
            file: fname.split('.')[0],
            msg: 'db download corrupted'
          }
          gz.unzip(db_gz, [__dirname, 'app/db', fname].join('/'), function(err){
            if(err){return win.webContents.send('update-db', obj)}
            obj.success = true;
            obj.type = 'success';
            delete obj.msg;
            win.webContents.send('update-db', obj);
          })

          } else {
            let obj = {
              type: 'success',
              msg: fname +' download complete'
            };
            if (state !== 'completed'){
              obj.type = 'danger';
              obj.msg = fname +' download failed';
            }
            win.webContents.send('dl-stat', obj)
          }

        })
      }

    })


}

app.whenReady(function(){

}).then(init);

app.on('window-all-closed', function(){
  if (process.platform !== 'darwin'){
    app.quit();
  }
})

app.on('activate', function(){
  if (BrowserWindow.getAllWindows().length === 0){
    init();
  }
})

app.on('certificate-error', function(event, webContents, url, err, cert, cb) {
  console.log(url)
  event.preventDefault();
  cb(true);
});
