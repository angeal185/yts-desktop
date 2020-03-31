const fs = require('fs'),
h = require('./h'),
rout = require('./rout'),
tpl = require('./tpl'),
{ls,ss} = require('./storage');

const utils = {
  pre: function(cb){
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(fs.readFileSync(base_dir +'/app/static/css/main.min.css', 'utf8'));
      document.adoptedStyleSheets = [sheet];
      document.title = config.main_cnf.title;
      if(!ls.get('suggest')){
        ls.set('suggest', [])
      }
      return cb(false)
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  empty: function(i, cb){
    while (i.firstChild) {
      i.removeChild(i.firstChild);
    }
    cb()
  },
  emptySync: function(i){
    while (i.firstChild) {
      i.removeChild(i.firstChild);
    }
  },
  init: function(){
    let x = document;
    x.body.append(
      tpl.base(),
    )

    let main = document.getElementById('app-main');

    window.addEventListener('hashchange', function() {
      let dest = location.hash.slice(1).split('/');

      if(dest[0] === 'movie'){
        ss.set('mov_id', dest[1]);
      }

      utils.empty(main, function(){
        ss.set('dest', dest[0]);
        rout[dest[0]](main);
        utils.totop(0);
      });
    }, false);

    if(location.hash !== '#home'){
      location.hash = 'home';
    } else {
      ss.set('dest', 'home');
      rout['home'](main);
    }

  },
  clone_obj: function(obj){
    return Object.assign({}, obj);
  },
  totop: function(i){
    window.scroll({
      top: i,
      left: 0,
      behavior: 'smooth'
    });
  },
  is_online: function(i){
    i.classList.add('green');
    i.classList.remove('red');
    i.title = 'online';
    ss.set('is_online', true)
  },
  is_offline: function(i){
    i.classList.add('red');
    i.classList.remove('green');
    i.title = 'offline';
    ss.set('is_online', true)
  },
  add_spn: function(item, text){
    item.setAttribute('disabled', true);
    utils.empty(item);
    item.append(h('span.spinner-grow.spinner-grow-sm.mr-1'), text);
  },
  remove_spn: function(item, text){
    item.removeAttribute('disabled');
    utils.empty(item);
    item.innerText = text;
  },
  toast: function(i, msg){
    const toast = h('div#toast.alert.alert-'+ i, {
        role: "alert"
    }, msg);
    document.body.append(toast);
    setTimeout(function(){
      toast.classList.add('fadeout');
      setTimeout(function(){
        toast.remove();
      },1000)
    },3000)
    return;
  },
  version_check: function(current,latest){
    let x = current.split('.'),
    y = latest.split('.');
    for (let i = 0; i < 3; i++) {
      if(parseInt(y[i]) > parseInt(x[i])){
        return latest;
      }
    }
    return false
  },
  get_year: function(){
    let d = new Date();
    return d.getFullYear();
  },
  debounce: function(func, wait, immediate) {
  	var timeout;
  	return function() {
  		var context = this, args = arguments;
  		var later = function() {
  			timeout = null;
  			if (!immediate) func.apply(context, args);
  		};
  		var callNow = immediate && !timeout;
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  		if (callNow) func.apply(context, args);
  	};
  },
  capitalize: function(str) {
   try {
     let x = str[0] || str.charAt(0);
     return x  ? x.toUpperCase() + str.substr(1) : '';
   } catch (err) {
     if(err){return str;}
   }
  },
  fetch: function(url, cb){
    fetch(url, {
      method: 'GET',
      headers: headers.json_cors
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(data) {
      if(data.status === 'ok'){
        data = data.data;
      }
      cb(false, data)
    })
    .catch(function(err){
      cb(err)
    })
  },
  fetch_subs: function(url, cb){
    fetch(url, {
      method: 'GET',
      headers: headers.html_cors
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        return res.text();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(data) {
      if(data.status === 'ok'){
        data = data.data;
      }
      cb(false, data)
    })
    .catch(function(err){
      cb(err)
    })
  },
  quick_search: function(term){
    term = encodeURIComponent(term);
    utils.fetch(config.base_url + 'list_movies.json?limit=5&query_term='+term, function(err,res){
      if(err){return ce(err)}
      let evt = new CustomEvent('quick_search', {
        detail: res.movies
      })
      window.dispatchEvent(evt);
    })
  },
  build_search_url: function(obj){
    let s_url = '';
    for (let key in obj) {
      if(obj[key] !== 'all'){
        s_url += '&'+key+'='+obj[key]
      }
    }
    return s_url
  }
}

module.exports = utils;
