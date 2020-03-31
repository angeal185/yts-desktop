const { app, session, BrowserWindow } = require('electron'),
config = require('./app/config');

function init(){
  const win = new BrowserWindow(config.main_cnf);
  win.loadFile('./app/index.html');
  win.webContents.openDevTools();
}

app.whenReady().then(init);

app.on('window-all-closed', function(){
  session.defaultSession.clearStorageData({storages:'cookies'})
  if (process.platform !== 'darwin'){
    app.quit();
  }
})

app.on('activate', function(){
  if (BrowserWindow.getAllWindows().length === 0){
    init();
  }
})
