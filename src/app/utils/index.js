const { ipcRenderer } = require('electron'),
session = require('electron').remote.session,
Cookies = session.defaultSession.cookies,
fs = require('fs'),
h = require('./h'),
_ = require('lodash'),
config = require('../config'),
rout = require('./rout'),
tpl = require('./tpl'),
urls = require('./urls'),
enc = require('./enc'),
scrap = require('./scrap'),
{ls,ss} = require('./storage');

const utils = {
  pre: function(doc, cb){
    try {
      let fonts = jp(fs.readFileSync(base_dir + urls.fonts, 'utf8'));
      for (let i = 0; i < fonts.length; i++) {
        utils.add_font(window, fonts[i], doc);
      }

      fonts = null;

      utils.add_styles(window, doc, 'main');

      utils.base_img_cache(function(err){
        if(err){return utils.toast('danger', err)}
        if(!ls.get('suggest')){
          ls.set('suggest', []);
        }
        return cb(false);
      });
    } catch (err) {
      if(err){return cb(err);}
    }
  },
  base_img_cache: function(cb){

    fs.readFile(base_dir + urls.imgs, 'utf8', function(err, img){
      if(err){return cb('base_img_cache error')}
      img = jp(img);

      let arr = config.base_img_cache,
      imgtype;

      for (let i = 0; i < arr.length; i++) {
        if(arr[i] !== 'logo'){
          imgtype = 'img/png'
        } else {
          imgtype = 'image/svg+xml'
        }
        base_img_cache[arr[i]] = URL.createObjectURL(new Blob(
          [new Uint8Array(Buffer.from(img[arr[i]], 'base64'))],
          {type: imgtype}
        ))
      }
      img = null;
      cb(false);
    })
  },
  add_styles: function(win, doc, styl){
    let styles = jp(fs.readFileSync(base_dir + urls.styles, 'utf8')),
    sheet = new win.CSSStyleSheet();

    sheet.replaceSync(styles[styl]);
    doc.adoptedStyleSheets = [sheet];
    styles = null;
    return;
  },
  add_font: function(win, obj, doc){
    let buff = new Uint8Array(Buffer.from(obj.data, 'base64')).buffer;

    buff = new win.FontFace(obj.name, buff, {
      style: obj.style,
      weight: obj.weight
    })

    buff.load().then(function(res) {
      doc.fonts.add(res);
    }).catch(function(err) {
      cl(obj.path +' failed to load')
    });

  },
  bl: function(){
    config.bl = true;
    config.api.mtk = enc.rand(8).toString('hex');
    fs.writeFileSync(base_dir + urls.config, js(config,0,2));
    require.cache[base_dir + urls.config].exports = config;
  },
  update_settings: function(cnf){
    fs.writeFileSync(base_dir + urls.config, js(cnf,0,2));
    require.cache[base_dir + urls.config].exports = cnf;
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
  mailto: function(subject){
    return h('a', {
      href: 'mailto:'+ config.contact.email +'?subject='+ subject,
      onclick: function(){
        return false;
      }
    }, config.contact.email)
  },
  cache_img: function(url){
    cd('cach img')
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
  set_inbox_cnt: function(i){
    let msg = 'you have '+ i +' message';
    if(i !== 1){
      msg+='s';
    }
    return msg
  },
  emptySync: function(i){
    while (i.firstChild) {
      i.removeChild(i.firstChild);
    }
  },
  init: function(doc, cb){
    try {
      let main = tpl.base();
      doc.body.append(
        main
      )

      main = main.lastChild;

      window.addEventListener('hashchange', function() {
        if(location.origin !== 'file://'){
          return;
        }
        let dest = location.hash.slice(1).split('/');
        cd(dest[0])
        if(['news', 'movie', 'search'].indexOf(dest[0]) === -1){
          if(pag_db.value().length > 0){
            pag_db.set('search', []).write();
          }
        } else {

          if(dest[0] === 'movie'){
            ss.set('mov_id', dest[1]);
          }

          if(dest[0] === 'news'){

            let news_db = jp(fs.readFileSync(base_dir + urls.news_db), 'utf8'),
            news_res;

            if(dest.length === 1){
              news_res = _.chunk(_.orderBy(news_db ,['date'], ['desc']), 10)
              pag_db.set('search', news_res).write();
            } else {
              news_res = _.filter(news_db, function(i){
                return i[dest[1]] === dest[2];
              })
              news_res = _.chunk(_.orderBy(news_res ,['date'], ['desc']), 10)
              cd(news_res)
              pag_db.set('search', news_res).write();
            }

            news_db = null;

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
      cb(false)
    } catch (err){
      ce(err)
      cb('fatal error')
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
    ss.set('is_online', false)
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
  set_id: function(cb){
    utils.fetch(urls.id, function(err,res){
      if(err){return cb(err)}
      let tst = res.ip.split('.');
      if(tst && tst.length === 4){
        for (let i = 0; i < tst.length; i++) {
          if(typeof parseInt(tst) !== 'number'){
            return cb('invalid id')
          }
        }
        ls.set('id', enc.hex_enc(res.ip))
        return cb(false)
      } else {
        return cb('invalid id')
      }
    })
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
  check_hit: function(id){
    try {
      let items = ls.get('hit_items');
      for (let i = 0; i < items.length; i++) {
        if(items[i].id === id){
          return items[i].val;
        }
      }
      return false
    } catch (err) {
      if(err){return false}
    }
  },
  store_hit: function(id, val){
    try {
      let items = ls.get('hit_items') || [],
      exists = false;

      for (let i = 0; i < items.length; i++) {
        if(items[i].id === id){
          items[i].val = val;
          exists = true;
        }
      }

      if(exists === false){
        items.push({
          id: id,
          val: val
        })
      }

      ls.set('hit_items', items);
    } catch (err) {
      if(err){return ce(err)}
    }
  },
  init_hit: function(){
    let h_check = ls.get('hit_items')
    if(
      h_check &&
      typeof h_check === 'object' &&
      ls.get('hit_items_date') &&
      ls.get('hit_items_date') > Date.now()
    ){
      return
    }

    ls.set('hit_items', []);
    ls.set('hit_items_date', Date.now() + 3600000);

  },
  add_hit_count: function(id, sel, cb){
    let dest;

    let hc = db.get('hits').value(),
    arr = null;
    if(hc[id] && hc[id][sel] !== 0){
      return cb(true)
    }

    if(!hc[id]){
      arr = [0,0,0];
    } else if(hc[id] && typeof hc[id] === 'object'){
      arr = hc[id]
    } else {
      ce('error in hits db')
      return cb(true)
    }

    dest = [urls.dev_counter, 'add'].join('/');

    fetch(dest, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      body: js({
        id: id,
        sel: sel,
        api: config.api.ptk
      })
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(res) {

      if(res.status === 'ok'){
        cl(res)
        arr[sel] = 1;
        db.set('hits.'+ id, arr).write();
        return cb(false, res.msg)
      } else if(res.status === 'blacklisted'){
        ls.set('bl',true);
        utils.bl();
        utils.toast('danger', res.msg);
      }
      cb(true)
    })
    .catch(function(err){
      cb(true)
    })
  },
  get_hit_count: function(id, cb){
    let dest;


    dest = [urls.dev_counter, 'count'].join('/');

    fetch(dest, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      body: js({
        id: id,
        api: config.api.ptk
      })
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(res) {

      if(res.status === 'ok'){
        cl(res)
        if(typeof res.msg === 'object'){

          utils.store_hit(id, res.msg)
          cb(false, res.msg)
        } else {
          cb(true)
        }
      } else {
        cb(true)
      }

    })
    .catch(function(err){
      cb(true)
    })
  },
  imdb_spec: function(id, cb){

      fetch([urls.imdb, 'title', id].join('/'), {
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
        cd(err)
        cb(true)
      })
  },
  rt_spec: function(ttl, cb){

    let api_url = urls.rt + '/api/private/v2.0/search?limit=1&q=' + ttl.split(' ').join('+');

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

      fetch(urls.rt + data.url, {
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

    fs.writeFile(base_dir + urls.staff_db, js(staff_db), function(err){
      if(err){return cb('failed to update staff_db')}
      cb(false)
    })
  },
  scrap_movie: function(cnt, hash_arr, cb){
    scrap.mov(config.trackers[cnt], hash_arr, function(err,res){
      if(err){
        cd(err)
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
      cd(res)
      cb(false, res)
    })
  },
  add_comments: function(id, title, x, rs){


    let cloader = h('h4.text-success', 'Fetching comments...',
      h('span.spinner-grow.spinner-grow-sm.ml-2.sp-lg.float-right')
    ),
    frame = h('iframe.iframe-container',{
      frameBorder: 0
    }),
    spn = h("span#IDCommentsPostTitle"),
    scr = h("script", {
      src: config.comments.url + config.comments.api
    }),
    doc,win;

    frame.onload = function(){
      doc = frame.contentDocument;
      win = frame.contentWindow;
      win.idcomments_acct = config.comments.cid;
      win.idcomments_post_id = id;
      win.idcomments_post_title = title;
      win.idcomments_post_url = [config.comments.post_url, x, id].join('/');

      let fonts = jp(fs.readFileSync(base_dir + urls.fonts, 'utf8'));

      for (let i = 0; i < fonts.length; i++) {
        if(fonts[i].name !== 'ico'){
          utils.add_font(win, fonts[i], doc);
        }
      }

      fonts = null;

      utils.add_styles(win, doc, 'comments')

      doc.body.append(spn);

      setTimeout(function(){
        doc.body.append(scr);
      },3000)

      var ud_ele = win.setInterval(function(){
        let wp_lnk = doc.getElementsByClassName('idc-loginbtn_wordpress')[0],
        shr = doc.getElementsByClassName('idc-share')[0],
        logout_lnk = doc.getElementById('IDLogoutLink2'),
        login_lnk = doc.getElementsByClassName('idc-btn_l');

        if(wp_lnk || shr || logout_lnk){
          cloader.remove();
          if(login_lnk){
            for (let i = 0; i < login_lnk.length; i++) {
              if(login_lnk[i].lastChild.firstChild.innerText === 'Login'){
                login_lnk[i].removeAttribute('href');
                login_lnk[i].setAttribute('onclick', 'logUserIn(); return false;');
                login_lnk[i].addEventListener('click', function(){
                  setTimeout(function(){
                    utils.emptySync(rs);
                    rs.append(utils.add_comments(id,title,x,rs));
                  },5000)
                })
              }
            }
          }

          if(logout_lnk){
            logout_lnk.removeAttribute('href');
            logout_lnk.parentNode.children[0].removeAttribute('href');
            logout_lnk.onclick = function(){
              Cookies.get({url: config.comments.url})
              .then(function(c){
                let cnt = 0,
                clen = c.length;

                for (let i = 0; i < clen; i++) {
                  Cookies.remove(config.comments.url, c[i].name)
                  .then(function(c){
                      cnt++
                      if(cnt === clen){
                        cd('all comments personal data cleaned.')
                        utils.emptySync(rs);
                        rs.append(utils.add_comments(id,title,x,rs))
                      }
                  }).catch(function(err){
                    cl(err)
                  })
                }
              }).catch(function(err){
                cl(err)
              })

            }
          }

          if(wp_lnk){
            wp_lnk.remove();
          }

          if(shr){
            shr.remove();
          }

          ud_ele = null;

          const obsvr = new win.MutationObserver(
            utils.debounce(function(mutationsList, observer) {
              setTimeout(function(){
                utils.clean_comments(doc)
              },1000)
            },500)
          );

          obsvr.observe(doc.body, {
            attributes: false,
            childList: true,
            subtree: true
          });

          utils.clean_comments(doc)
          ss.set('cto', 0)
          return win.clearInterval(ud_ele)
        }
      },3000)

      win.setTimeout(function(){
        if(ud_ele){
          win.clearInterval(ud_ele);
          setTimeout(function(){
            let cto = ss.get('cto') || 0;
            utils.emptySync(rs);
            if(cto < 10){
              ss.set('cto', cto++)
              rs.append(utils.add_comments(id,title,x,rs));
            } else {
              rs.append(h('p.text-danger', 'max timeout retry attempts reached.'))
            }

          },5000)
          return cd('comments timeout')
        }
      }, 30000)

    }

    return h('div',
      cloader,
      frame
    );

  },
  clean_comments: function(doc){

    doc.querySelectorAll('.idc-i > a').forEach(function(ele){
      ele.target = '_blank'
    });

    doc.querySelectorAll('.idc-i > em > a').forEach(function(ele){
      ele.removeAttribute('href')
    });

  },
  comment_count: function(){
    fetch(urls.comments + '/widgets/blogStats/417295', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/javascript',
        'Accept-Encoding': 'gzip',
        'Sec-Fetch-Dest': 'object',
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
    .then(function(data) {
      let obj = {
        comments: parseInt(data.split('<strong>')[1].split('</strong>')[0].trim()),
        users: parseInt(data.split('<strong>')[2].split('</strong>')[0].trim())
      }
      cl(obj)
    })
    .catch(function(err){
      cl(err)
    })

  }
}

module.exports = utils;
