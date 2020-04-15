const fs = require('fs'),
h = require('./h'),
config = require('../config'),
rout = require('./rout'),
request = require('request'),
{ ipcRenderer } = require('electron'),
execFile = require('child_process').execFile,
jpegtran = require('jpegtran-bin'),
news_db = require('../db/news_db'),
tpl = require('./tpl'),
scrap = require('./scrap'),
{ls,ss} = require('./storage');

const utils = {
  pre: function(doc, cb){
    try {

      for (let i = 0; i < config.fontface.length; i++) {
        utils.add_font(config.fontface[i], doc);
      }

      utils.add_styles(doc);

      if(!ls.get('suggest')){
        ls.set('suggest', []);
      }

      return cb(false);
    } catch (err) {
      if(err){return cb(err);}
    }
  },
  add_styles: function(doc){
    let sheet = new CSSStyleSheet();
    sheet.replaceSync(fs.readFileSync(base_dir + config.CSS, 'utf8'));
    doc.adoptedStyleSheets = [sheet];
  },
  add_font: function(obj, doc){
    let buff = new Uint8Array(fs.readFileSync(base_dir + obj.path)).buffer;
    buff = new FontFace(obj.name, buff, {
      style: obj.style,
      weight: obj.weight
    })

    buff.load().then(function(res) {
      doc.fonts.add(res);
    }).catch(function(err) {
      cl(obj.path +' failed to load')
    });

  },
  update_settings: function(cnf){
    fs.writeFileSync(base_dir + '/app/config/index.json', JSON.stringify(cnf,0,2));
    require.cache[base_dir + '/app/config/index.json'].exports = cnf;
    utils.toast('success', 'Settings updated');
  },
  update_db: function(res){
    if(!res.success){
      return utils.toast(res.type, res.msg)
    }

    window.dispatchEvent(
      new CustomEvent('db-status', {
        detail: 1
      })
    );

    status_db.get(res.file).assign(ls.get(res.file +'_hash')).write();
    utils.toast('success', res.file +' update complete');
    update_cnt--
    if(update_cnt < 1){
      setTimeout(function(){
        location.reload();
      },1000)
    }

    return

  },
  cache_img: function(url){
    ipcRenderer.send('dl-img', url)
  },
  cache_img_reset: function(){
    db.set('img_cache', []).write();
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
  init: function(doc){
    let main = tpl.base();
    doc.body.append(
      main
    )

    main = main.lastChild;

    window.addEventListener('hashchange', function() {
      let dest = location.hash.slice(1).split('/');

      if(dest[0] === 'movie'){
        ss.set('mov_id', dest[1]);
      }

      if(dest[0] === 'news'){
        let news_res;
        if(dest.length === 1){
          news_res = _.chunk(_.orderBy(news_db ,['date'], ['desc']), 10)
          pag_db.set('search', news_res).write();
        } else {
          news_res = _.filter(news_db, function(i){
            return i[dest[1]] === dest[2];
          })
          news_res = _.chunk(_.orderBy(news_res ,['date'], ['desc']), 10)
          cl(news_res)
          pag_db.set('search', news_res).write();
        }

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
  globe_change: function(i,a,b,c,d){
    i.classList.add(a);
    i.classList.remove(b,c);
    i.title = d;
  },
  is_online: function(i){
    utils.globe_change(i,'green','red', 'orange','online')
    ss.set('is_online', true)
  },
  is_offline: function(i){
    utils.globe_change(i,'red','green', 'orange', 'offline')
    ss.set('is_online', true)
  },
  add_spn: function(item, text){
    item.parentNode.setAttribute('disabled', true);
    utils.emptySync(item);
    item.append(h('span.spinner-grow.spinner-grow-sm.mr-1'), text);
  },
  remove_spn: function(item, text){
    setTimeout(function(){
      item.parentNode.removeAttribute('disabled');
      utils.emptySync(item);
      item.innerText = text;
    },1000)
  },
  add_sp: function(item, text, cb){
    utils.emptySync(item);
    item.append(h('span.spinner-grow.spinner-grow-sm.mr-1'), text);
    cb()
  },
  remove_sp: function(item, text){
    setTimeout(function(){
      utils.emptySync(item);
      item.innerText = text;
    },1000)
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
  date2ts: function(x){
    return Date.parse(x);
  },
  format_date: function(i){
    let date = new Date(i),
    dd = date.getDate(),
    mm = date.getMonth()+1,
    yyyy = date.getFullYear();

    if(dd < 10){
      dd = '0' + dd
    }

    if(mm < 10){
      mm = '0' + mm
    };

    return [yyyy, mm, dd].join('-')
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
  getJSON: function(url, cb){
    fetch(url, {
      method: 'GET',
      headers: headers.json
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
    term = term.toLowerCase()
    let res = movie_db.filter(function(x){
      return x.title.toLowerCase().includes(term)
    }).slice(0,5).value();


    window.dispatchEvent(
      new CustomEvent('quick_search', {
        detail: res
      })
    );

  },
  formatBytes: function(bytes, decimals) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
  imdb_spec: function(id, cb){

      fetch('https://m.imdb.com/title/'+ id, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html',
          'Accept-Encoding': 'gzip',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      })
      .then(function(res){
        if (res.status >= 200 && res.status < 300) {
          return res.text();
        } else {
          return Promise.reject(new Error(res.statusText))
        }
      })
      .then(function(res) {
        let obj = {};
        let start = '<script type="application/ld+json">',
        end = '</script>';

        let c_start ='<h3>Country of Origin</h3>',
        g_start ='<h3>Cumulative Worldwide Gross:</h3>',
        m_start = '<span class="metascore ',
        p_end = '</p>',
        sp_end = '</span>';

        let txt = JSON.parse(res.split(start)[1].split(end)[0]);

        obj.metascore = (function(){
          try {
            return res.split(m_start)[1].split(sp_end)[0].split('>')[1].trim();
          } catch (err) {
            return 'N/A';
          }
        })()
        obj.gross = (function(){
          try {
            return res.split(g_start)[1].split(p_end)[0].replace('<p>', '').trim();
          } catch (err) {
            return 'N/A';
          }
        })();
        obj.mpa_rating = txt.contentRating || 'N/A'
        if(txt.creator){
          if(Array.isArray(txt.creator)){
            if(txt.creator[0].name){
              obj.writter = txt.creator[0].name
            } else {
              obj.writter = ''
            }
          } else if (!txt.creator.name) {
            obj.writter = ''
          } else {
            obj.writter = txt.creator.name
          }
        } else {
          obj.writter = ''
        }

        if(txt.director){
          if(Array.isArray(txt.director)){
            obj.director = txt.director[0].name
          } else if (!txt.director.name) {
            obj.director = ''
          } else {
            obj.director = txt.director.name
          }
        } else {
          obj.director = ''
        }

        if(txt.aggregateRating && txt.aggregateRating.ratingCount){
          obj.votes = txt.aggregateRating.ratingCount;
          obj.rating = parseFloat(txt.aggregateRating.ratingValue);
        } else {
          obj.votes = 0;
          obj.rating = 0
        }

        obj.published = txt.datePublished|| 'N/A';

        cb(false, obj)

      })
      .catch(function(err){
        cl(err)
        cb(true)
      })
  },
  rt_spec: function(ttl, cb){

    let api_url = 'https://www.rottentomatoes.com/api/private/v2.0/search?limit=1&q=' + ttl.split(' ').join('+');

    fetch(api_url, {
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
      if(data.movies && data.movies.length > 0){
        data = data.movies[0];
      } else{
        return cb(true)
      }

      fetch("https://www.rottentomatoes.com"+ data.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html',
          'Accept-Encoding': 'gzip',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      })
      .then(function(res){
        if (res.status >= 200 && res.status < 300) {
          return res.text();
        } else {
          return Promise.reject(new Error(res.statusText))
        }
      })
      .then(function(txt) {
        let obj = {},
        start = '<span class="mop-ratings-wrap__percentage">',
        end = '</span>',
        cnt = 0,
        score;
        try {
          obj.rt_percent = txt.split(start)[1].split(end)[0].trim();
        } catch (err) {
          cnt++
          obj.rt_percent = 'N/A';
        }
        try {
          obj.rt_audience = txt.split(start)[2].split(end)[0].trim();
        } catch (err) {
          cnt++
          obj.rt_audience = 'N/A'
        }

        if(cnt === 2){
          return cb(true)
        }

        cb(false, obj)
      })
      .catch(function(err){
        cb(true)
      })

    })
    .catch(function(err){
      cb(true)
    })

  },
  snake_case: function(str){
    try {
      return str.replace(/ /g, '_');
    } catch (err) {
      if(err){return str;}
    }
  },
  staff_db: function(cb){

    let x = movie_db.value(),
    staff_db = {
      actors: [],
      directors: [],
      writters: []
    };

    for (let i = 0; i < x.length; i++) {
      for (let j = 0; j < x[i].cast.length; j++) {
        if(staff_db.actors.indexOf(x[i].cast[j].name) === -1){
          staff_db.actors.push(x[i].cast[j].name)
        }
      }

      if(staff_db.directors.indexOf(x[i].director) === -1){
        staff_db.directors.push(x[i].director)
      }

      if(staff_db.writters.indexOf(x[i].writter) === -1){
        staff_db.writters.push(x[i].writter)
      }
    }

    staff_db.actors = staff_db.actors.sort();
    staff_db.directors = staff_db.directors.sort();
    staff_db.writters = staff_db.writters.sort();

    fs.writeFile(base_dir +'/app/db/staff_db.json', js(staff_db), function(err){
      if(err){return cb('failed to update staff_db')}
      cb(false)
    })
  },
  scrap_movie: function(cnt, hash_arr, cb){
    scrap.mov(config.trackers[cnt], hash_arr, function(err,res){
      if(err){
        cl(err)
        return cb(true)
      }
      if(res && !res[0].infoHash && res.length === 5){
        res = [{
          infoHash: res[1],
          complete: res[2],
          downloaded: res[3],
          incomplete: res[4]
        }]
      }
      cl(res)
      cb(false, res)
    })
  }
}

module.exports = utils;
