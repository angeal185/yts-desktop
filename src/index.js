const { app, session, BrowserWindow, ipcMain } = require('electron'),
path = require('path'),
url = require('url'),
gz = require('./app/utils/gzip'),
urls = require('./app/utils/urls'),
config = require('./app/config');

config.main_cnf.icon = __dirname + config.settings.ico;
config.main_cnf.webPreferences.preload = __dirname + "/app/main.js";

function init(){

  const win = new BrowserWindow(config.main_cnf);

  let dest = url.format({
    protocol: 'file',
    slashes: true,
    pathname: path.join(__dirname, config.base_file)
  })

  win.loadURL(dest, {
    extraHeaders: 'Content-Type:text/html;charset=utf-8;'
  });

  win.webContents.openDevTools();

  ipcMain.on('dl-img', function(event, arg) {
    win.webContents.session.downloadURL(arg)
  })

  ipcMain.on('update-db', function(event, arg) {
    win.webContents.session.downloadURL(arg)
  })


  win.webContents.session.on('will-download', function(event, item, webContents){
    let fname = item.getFilename(),
    ttl;

    if(path.extname(fname) === '.torrent'){
      item.setSavePath([config.settings.downloads, 'torrent', fname].join('/'))
    } else if(path.extname(fname) === '.zip'){
      item.setSavePath([config.settings.downloads, 'subs', fname].join('/'))
    } else if(path.extname(fname) === '.jpg'){
      ttl = item.getURL().split('/');
      ttl = ttl.slice(0,-1).pop() + '.jpg';
      item.setSavePath([__dirname, 'app/cache/img', ttl].join('/'))
    } else if(path.extname(fname) === '.gz'){
      let db_gz = [config.settings.downloads, 'db', fname].join('/');
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
        let obj = {
          success: false,
          type: 'danger',
          msg: 'db download corrupted'
        }
        gz.unzip(db_gz, [__dirname, urls.dbcache].join('/'), function(err){
          if(err){return win.webContents.send('update-db', obj)}
          obj.success = true;
          obj.type = success;
          delete obj.msg
          win.webContents.send('update-db', obj)
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
  })
}

app.whenReady().then(init);

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
