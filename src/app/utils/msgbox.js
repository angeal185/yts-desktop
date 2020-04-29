const config = require('../config'),
enc = require('./enc'),
{ ls } = require('./storage'),
uuidv4 = require('uuid/v4'),
urls = require('./urls');

const msgbox = {
  init: function(){
    msgbox.create('inbox', config.msgbox.inbox_msg, function(err){
      if(err){return cl(err)}
      msgbox.create('outbox', config.msgbox.outbox_msg, function(err){
        if(err){return cl(err)}
        utils.toast('success', 'new inbox and outbox created')
      })
    })
  },
  create: function(dest, body, cb){
    db.set(dest, {}).write();

    let obj = {
      api: uuidv4(),
      id: 'yts_'+ enc.rand(24).toString('hex')
    }

    fetch([urls.msgbox, obj.id].join('/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'x-api-key': obj.api
      },
      body: js(body)
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(data) {

      db.get(dest).assign({
        api: obj.api,
        id: obj.id,
        data: data
      }).write();
      cb(false)
    })
    .catch(function(err){
      cb(err)
    })

  },
  send: function(body, cb){
    let obj = db.get('outbox').value();

    fetch([urls.msgbox, obj.id].join('/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'x-api-key': obj.api
      },
      body: js(body)
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(data) {
      if(typeof data === 'object'){
        obj.data.push(data);
        db.set('outbox.data', obj.data).write();

        cl(db.get('outbox').value());
        return cb(false, data)
      }
      cb('inbox type error.')
    })
    .catch(function(err){
      cb(err)
    })

  },
  fetch: function(cb){
    let mcheck = ls.get('inbox_check');
    if(!mcheck || mcheck < Date.now()){

      let obj = db.get('inbox').value();

      fetch([urls.msgbox, obj.id].join('/'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip',
          'Sec-Fetch-Dest': 'object',
          'Sec-Fetch-mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      })
      .then(function(res){
        if (res.status >= 200 && res.status < 300) {
          return res.json();
        } else {
          return Promise.reject(new Error(res.statusText))
        }
      })
      .then(function(data) {
        if(typeof data === 'object'){
          let current = db.get('inbox.data').size().value() || 0;

          db.set('inbox.data', data).write();
          ls.set('inbox_check', Date.now() + config.msgbox.inbox_check);

          if(data.length !== current){
            current = true;
          } else {
            current = false;
          }
          return cb(false, data.length, current);
        }
        cb('unable to update inbox at this time, try again later')
      })
      .catch(function(err){
        cb(err)
      })
    }
  },
  fetch_out: function(cb){

    let obj = db.get('outbox').value(),
    mcheck = ls.get('outbox_check');

    if(!mcheck || mcheck < Date.now()){
      fetch([urls.msgbox, obj.id].join('/'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip',
          'Sec-Fetch-Dest': 'object',
          'Sec-Fetch-mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      })
      .then(function(res){
        if (res.status >= 200 && res.status < 300) {
          return res.json();
        } else {
          return Promise.reject(new Error(res.statusText))
        }
      })
      .then(function(data) {
        if(typeof data === 'object'){
          db.set('outbox.data', data).write();
          ls.set('outbox_check', Date.now() + config.msgbox.outbox_check);
          return cb(false)
        }
        cb('unable to verify outbox at this time.')
      })
      .catch(function(err){
        cb(err)
      })
    }

  },
  delete: function(dest, id){

  },
  put: function(){



  }
}

module.exports = msgbox;
