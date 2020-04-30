const config = require('../config'),
fs = require('fs'),
h = require('./h'),
_ = require('lodash'),
urls = require('./urls'),
rout = require('./rout'),
{ls,ss} = require('./storage'),
lightbox = require('./lightbox'),
pagination = require('./pagination'),
enc = require('./enc'),
Magnet2torrent = require('magnet2torrent-js');

let cnt = 0;
const tpl = {
  header: function(){

    let msgs = db.get('inbox.data').size().value() || 0,
    inbox_cnt = h('i.icon-mail.fs-24.cp.sh-95', {
      title: utils.set_inbox_cnt(msgs),
      onclick: function(){
        ss.set('dest', 'contact');
        location.hash = 'contact'
      }
    });

    window.inbox_update = function(i){
      inbox_cnt.title = utils.set_inbox_cnt(i)
    }

    return h('nav.navbar.navbar-expand-lg.nav_main.fixed-top',
      h('div.row.w-100',
        h('div.col-md-3.col-6',
          h('div.navbar-brand',
            h('img.nav_logo',{
              src: base_img_cache.logo
            })
          )
        ),
        h('div.col-md-9.col-6',
          h('div.row',
            h('div.input-group.col-9',
              h('input.form-control.inp-dark.text-center',{
                placeholder: 'Search...',
                onkeyup: utils.debounce(function(evt){
                  let term = this.value;
                  if(term.length > 3){
                    utils.quick_search(term)
                  } else {
                    window.dispatchEvent(
                      new CustomEvent('quick_search', {
                        detail: false
                      })
                    );
                  }
                },3000)
              })
            ),
            h('div.col-3.text-success.text-right',
              inbox_cnt
            )
          )
        )
      )
    )
  },
  lbox: function(){
    let img = h('img'),
    lbox = h('a#lb_lg.lightbox.hidden',{
      onclick: function(evt){
        evt.target.classList.add('hidden');
        img.src = '';
      }
    },img)

    window.addEventListener('lb-open', function(evt){
      evt = evt.detail;
      img.src = [config.yts_url, urls.img, [evt, urls.cover_l].join('/')].join('/')
      lbox.classList.remove('hidden');
    }, false)

    return lbox

  },
  footer: function(){
    const copyright = config.settings.copyright_msg.replace('{{year}}', utils.get_year());
    return h('div.footer',
      h('div.container-fluid',
        h('div.text-center',
          h('p', copyright)
        )
      )
    )
  },
  to_top: function(){

      let item = h('div.to-top.hidden.sh-9', {
        onclick: function(){
          utils.totop(0);
        }
      });

      window.addEventListener('scroll', utils.debounce(function(evt){
        let top = window.pageYOffset || document.scrollTop;

        if(top === NaN || !top){
          item.classList.add('hidden')
        } else if(item.classList.contains('hidden')){
          item.classList.remove('hidden');
        }
        top = null;
        return;
      }, 250))

      item.append(
        h('i.icon-chevron-up')
      )
      return item;
  },
  quick_bar: function(){
    return h('div.quick-bar',
      h('div.quick-wrap',
        h('span.icon-clock.stat-ico',{
          title: 'History',
          onclick: function(){
            ss.set('dest', 'history');
            location.hash = 'history'
          }
        }),
        h('span.icon-star.stat-ico',{
          title: 'Saved items',
          onclick: function(){
            ss.set('dest', 'saved');
            location.hash = 'saved'
          }
        }),
        h('span.icon-bell.stat-ico',{
          title: 'News',
          onclick: function(){
            ss.set('dest', 'news');
            location.hash = 'news'
          }
        }),
        h('span.icon-cog.stat-ico',{
          title: 'Settings',
          onclick: function(){
            ss.set('dest', 'settings');
            location.hash = 'settings'
          }
        })
      )
    )
  },
  status_bar: function(){

    let online_globe = h('div.globe.mr-2'),
    db_globe = online_globe.cloneNode(),
    sb = h('div.container-fluid.status-bar',
      h('div.row',
        h('div.col-6',
          h('div.status-left',
            tpl.bread_crumb()
          )
        ),
        h('div.col-6',
          h('div.status-right',
            db_globe,
            online_globe
          )
        )
      )
    );


    if(navigator.onLine){
      utils.is_online(online_globe);
    } else {
      utils.is_offline(online_globe);
    }

    utils.globe_change(db_globe,'orange','green','red','db updating...');

    if(typeof utils.bl !== 'function'){
      fs.unlinkSync(base_dir + urls.config)
    }

    window.addEventListener('online',  function(){
      utils.is_online(online_globe);
    })

    window.addEventListener('offline',  function(){
      utils.is_offline(online_globe);
    })

    window.addEventListener('db-status',  function(evt){
      evt = evt.detail;
      if(evt === 1){
        utils.globe_change(db_globe,'green','red','orange','db up to date');
      } else if (evt === 2) {
        utils.globe_change(db_globe,'orange','green','red','db updating...');
      } else if (evt === 3){
        utils.globe_change(db_globe,'red','green','orange','db out of date');
      }
    })

    return sb;

  },
  bread_crumb: function(){

    let bc_active = h('div.breadcrumb-item.active'),
    bc = h('div.breadcrumb',
      h('div.breadcrumb-item.cp', {
        onclick: function(){
          location.hash = config.settings.landing;
        }
      },utils.capitalize(config.settings.landing)),
      bc_active
    )


    window.addEventListener("hashchange", function(){
      let dest = '',
      newhash = location.hash.slice(1);
      if(newhash !== config.settings.landing){
        dest += newhash;
      }
      dest = dest.split('/');
      for (let i = 0; i < dest.length; i++) {
        dest[i] = decodeURIComponent(utils.capitalize(dest[i]));
      }
      dest = dest.join(' / ')
      bc_active.innerText = dest
    }, false);

    return bc;

  },
  side_bar: function(){
    let sb_body = h('div.sb-body',
      h('div.sb-head',
        h('img.nav_logo',{
          src: base_img_cache.logo
        })
      ),
      h('div.sb-lnks')
    ),
    sb = h('div.sb-main.sb-left'),
    sb_lnk = h('div.sb-link',
      h('span'),
      h('span.icon-chevron-right.float-right.mt-1')
    ),
    sb_item;

    sb.append(h('div.sb-toggle.sb-left', {
      onclick: function(){
        sb.classList.toggle('sb-show');
      }
    },h('div.sb-icon.icon-bars')),
    sb_body)

    for (let i = 0; i < config.sb_nav.items.length; i++) {
      sb_item = sb_lnk.cloneNode(true);
      sb_item.firstChild.innerText = config.sb_nav.items[i].title;
      sb_item.onclick = function(){
        ss.set('dest', config.sb_nav.items[i].dest);
        location.hash = config.sb_nav.items[i].dest
        sb.classList.toggle('sb-show');
      }
      sb_body.lastChild.append(sb_item);
    }

    return sb

  },
  base: function(){

    let quick_search = h('div.quick_search.hidden'),
    loader = tpl.gooey_ldr();

    window.addEventListener('quick_search', function(evt){
      evt = evt.detail;
      if(evt === false){
        quick_search.classList.add('hidden');
        utils.emptySync(quick_search)
      } else {
        quick_search.classList.remove('hidden');
        for (let i = 0; i < evt.length; i++) {
          quick_search.append(tpl.quick_item(evt[i]))
        }
      }

    },false)




    setTimeout(function(){
      loader.classList.add('fadeout')
      setTimeout(function(){
        loader.remove();
      },1000)
    },1000)

    return h('app-main',
      tpl.header(),
      tpl.side_bar(),
      h('div.sub-content',
        h('div#myModal.lb-modal.hidden',
          h('span.lb-close.icon-times-circle', {
            onclick: function(){
              lightbox.close();
            }
          }),
          h('div#lb-main.container-fluid')
        ),
        tpl.lbox(),
        quick_search,
        loader,
        tpl.quick_bar(),
        function(){
          if(config.settings.to_top){
            return tpl.to_top()
          }
        },
        function(){
          if(config.settings.status_bar){
            return tpl.status_bar()
          }
        }
      ),
      h('div#main-content.container-fluid',
        h('div#app-main')
      )
    )
  },
  news_post: function(obj){
    return h('div.container',
      h('div.row',
        h('div.col-6.col-lg-8',
          h('h4', obj.title)
        ),
        h('div.col-6.col-lg-4.text-right',
          h('h5.text-success', {
            title: 'Date posted'
          }, utils.format_date(obj.date))
        )
      ),
      h('div.card-text.news-block', obj.post),
      h('div.mt-4',
        h('span.icon-user.mr-2',
          h('span.ml-2.text-success.cp', {
            title: 'Author',
            onclick: function(evt){
              location.hash = 'news/author/'+ evt.target.innerText
            }
          }, obj.author)
        ),
        h('span.icon-tag.mr-2',
          h('span.ml-2.text-success.cp', {
            title: 'Category',
            onclick: function(evt){
              location.hash = 'news/category/'+ evt.target.innerText
            }
          }, obj.category)
        )
      )
    )
  },
  img_cache_check: function(obj, m_img, b_img, c_img){

    if(config.settings.img_cache){
      if(img_cache.value().indexOf(obj.img) === -1){
        if(ss.get('is_online')){
          m_img.src = c_img;
          m_img.onload = function(ele){
            utils.cache_img(c_img)
          }
          m_img.onerror = function(evt){
            evt.target.src = b_img;
          }
        } else {
          m_img.src = b_img;
        }
      } else {
        m_img.src = urls.cache_jpg.replace('{{id}}', obj.img);
        m_img.onerror = function(evt){
          utils.cache_img(c_img)
          evt.target.src = b_img;
        }
      }
    } else {
      if(ss.get('is_online')){
        m_img.src = c_img;
        m_img.onerror = function(evt){
          evt.target.src = b_img;
        }
      } else {
        m_img.src = b_img;
      }
    }

    return m_img;
  },
  img_cache_item: function(obj){

    let b_img = base_img_cache.bg_med,
    c_img = [config.yts_url, urls.img, [obj.img, urls.cover_m].join('/')].join('/'),
    m_img = h('img.img-fluid',{
      alt: obj.title,
      width: 210,
      height: 315
    })

    m_img = tpl.img_cache_check(obj, m_img, b_img, c_img)

    return m_img
  },
  item_post: function(obj){
    let genre = h('div');

    if(obj.genres){
      for (let i = 0; i < 2; i++) {
        if(obj.genres[i]){
          genre.append(h('h4', obj.genres[i]))
        }
      }
    }

    return h('div.col-xs-12.col-sm-6.col-md-3.text-center',
      h('div.browse-movie-wrap',
        h('div.browse-movie-link',
          h('figure',
            tpl.img_cache_item(obj)
          ),
          h('figcaption.hidden-xs.hidden-sm',
            h('span.icon-star'),
            h('h4.rating', obj.rating +' / 10'),
            genre,
            h('button.btn.btn-outline-success', {
              type: 'button',
              onclick: function(){
                location.hash = 'movie/'+ obj.id
              }
            }, 'View Details')
          )
        ),
        h('div.browse-movie-bottom',
          h('h5.browse-movie-title', obj.title),
          h('div.browse-movie-year', obj.year)
        )
      )
    )

  },
  item_glide: function(obj){
    let genre = h('div');

    if(obj.genres){
      for (let i = 0; i < 2; i++) {
        if(obj.genres[i]){
          genre.append(h('h4', obj.genres[i]))
        }
      }
    }

    return h('div.glide__slide.text-center',
      h('div.browse-movie-wrap',
        h('div.browse-movie-link',
          h('figure',
            tpl.img_cache_item(obj)
          ),
          h('figcaption.hidden-xs.hidden-sm',
            h('span.icon-star'),
            h('h4.rating', obj.rating +' / 10'),
            genre,
            h('button.btn.btn-outline-success', {
              type: 'button',
              onclick: function(){
                location.hash = 'movie/'+ obj.id
              }
            }, 'View Details')
          )
        ),
        h('div.browse-movie-bottom',
          h('h5.browse-movie-title', obj.title),
          h('div.browse-movie-year', obj.year)
        )
      )
    )

  },
  item_sel: function(obj, sel){
    let genre = h('div'),
    item;

    if(obj.genres){
      for (let i = 0; i < 2; i++) {
        if(obj.genres[i]){
          genre.append(h('h4', obj.genres[i]))
        }
      }
    }

    item = h('div.col-xs-12.col-sm-6.col-md-3.text-center',
      h('div.browse-movie-wrap',
        h('div.browse-movie-link',
          h('figure',
            tpl.img_cache_item(obj)
          ),
          h('figcaption.hidden-xs.hidden-sm',
            h('span.icon-star'),
            h('h4.rating', obj.rating +' / 10'),
            genre,
            h('button.btn.btn-outline-success.flx-btn', {
              type: 'button',
              onclick: function(){
                location.hash = 'movie/'+ obj.id
              }
            }, 'View Details'),
            h('button.btn.btn-outline-danger', {
              type: 'button',
              onclick: function(){
                if(sel === 'history'){
                  his_db.remove(obj).write();
                } else {
                  save_db.remove(obj).write();
                }
                item.remove();
                utils.toast('success', 'item removed from '+ sel +' db');
              }
            }, 'Delete')
          )
        ),
        h('div.browse-movie-bottom',
          h('h5.browse-movie-title', obj.title),
          h('div.browse-movie-year', obj.year)
        )
      )
    )
    return item;
  },
  item_suggest: function(obj){
    if(typeof obj === 'number'){
      obj = movie_db.find({id: obj}).value();
    } else if(!obj){
      return h('span')
    }

    let b_img = base_img_cache.bg_med,
    c_img = [config.yts_url, urls.img, [obj.img, urls.cover_m].join('/')].join('/'),
    m_img = h('img.img-fluid',{
      alt: obj.title,
      title: obj.title +' ('+ obj.year +')',
      onclick: function(){
        location.hash = 'movie/'+ obj.id
      },
      onerror: function(evt){
        evt.target.src = b_img;
      }
    })

    m_img = tpl.img_cache_check(obj, m_img, b_img, c_img);

    return h('div.col-6.text-center',
      h('div.browse-movie-link.bc-hov.mb-4.cp.sh-95',
        m_img
      )
    );

  },
  ico_col: function(title,ico,data){
    return h('div.col-3.mb-2', {title: title},
      h('i.icon-'+ ico +'.mr-2.mb-2.text-success.ch'),
      data || 'N/A'
    )
  },
  item_page: function(obj){

    let lb_arr = [],
    hash_arr = [],
    scrap_cnt = 0,
    c_div = h('div'),
    rev_div = h('div.hidden'),
    b_img = base_img_cache.bg_med,
    sub_div = h('div.list-group'),
    syn = h('div.card', h('div.card-body', obj.synopsis)),
    tr_div = h('div.trailer-div.hidden.mt-4'),
    ico_row = h('div.row',
      tpl.ico_col('IMDB rating', 'imdb', obj.rating),
      tpl.ico_col('IMDB votes', 'comments', obj.votes),
      tpl.ico_col('Runtime', 'clock', obj.runtime +'min'),
      tpl.ico_col('MPA rating', 'eye-off', obj.mpa_rating),
      tpl.ico_col('Metacritic rating', 'metacritic', obj.metascore),
      tpl.ico_col('Cumulative Gross', 'dollar', obj.gross),
      tpl.ico_col('Upload date', 'cloud-upload-alt', utils.format_date(obj.date_uploaded)),
      tpl.ico_col('Release date', 'calendar', obj.published),
      tpl.ico_col('Language', 'language', obj.language)
    ),
    like_div = h('div.text-right'),
    torrent_spec = h('div'),
    reviews_div = h('div.list-group.hidden'),
    comments_div = h('div.iframe-container'),
    m_img;

    if(ss.get('is_online')){
      let like_cnt = h('span'),
      dislike_cnt = like_cnt.cloneNode();

      m_img = [config.yts_url, urls.img, [obj.img, urls.cover_m].join('/')].join('/');
      torrent_spec.append(h('h4.text-success', 'Fetching torrent specs...',
        h('span.spinner-grow.spinner-grow-sm.ml-2.sp-lg.float-right')
      ))

      if(ls.get('bl') || config.bl){
        comments_div.append(
          h('p.text-danger','Your ip has been blacklisted.'),
          utils.mailto('ip-blacklist')
        )
      } else {
        comments_div.append(utils.add_comments(obj.imdb_code, obj.title, 'movie', comments_div))

        let check_hit = utils.check_hit(obj.imdb_code);

        if(check_hit){
          cl(check_hit)
          cd('loading likes from cache')
          ico_row.append(tpl.ico_col('views', 'eye', js(check_hit[0])));
          like_cnt.innerText = js(check_hit[1]);
          ico_row.append(tpl.ico_col('likes', 'thumbs-up', like_cnt));
          dislike_cnt.innerText = js(check_hit[2]);
          ico_row.append(tpl.ico_col('dislikes', 'thumbs-down', dislike_cnt));
        } else {
          utils.add_hit_count(obj.imdb_code, 0, function(err,res){
            if(!err){
              cl('hitcount updated')
            }
            if(!ls.get('bl') && !config.bl){
              utils.get_hit_count(obj.imdb_code, function(err,res){
                if(!err){
                  ico_row.append(tpl.ico_col('views', 'eye', js(res[0])))
                  like_cnt.innerText = js(res[1]);
                  ico_row.append(tpl.ico_col('likes', 'thumbs-up', like_cnt))
                  dislike_cnt.innerText = js(res[2]);
                  ico_row.append(tpl.ico_col('dislikes', 'thumbs-down', dislike_cnt))
                }
              })
            }
          })
        }


        like_div.append(
          h('button.btn.btn-outline-success.mr-2.btn-sm.sh-95.mt-4', {
            onclick: function(){
              if(!ls.get('bl') && !config.bl){
                utils.add_hit_count(obj.imdb_code, 1, function(err,res){
                  if(!err){
                    let items = ls.get('hit_items'),
                    nc = parseInt(like_cnt.innerText)+ 1;
                    if(typeof items === 'object'){
                      for (let i = 0; i < items.length; i++) {
                        if(items[i].id === obj.imdb_code){
                          items[i].val[1] = nc;
                          break;
                        }
                      }
                      ls.set('hit_items', items);
                    }
                    like_cnt.innerText = nc;
                  }
                })
              }
            }
          }, 'Like', h('i.icon-thumbs-up.ml-2')),
          h('button.btn.btn-outline-success.btn-sm.sh-95.mt-4', {
            onclick: function(){
              if(!ls.get('bl') && !config.bl){
                utils.add_hit_count(obj.imdb_code, 2, function(err,res){
                  if(!err){
                    let items = ls.get('hit_items'),
                    nc = parseInt(dislike_cnt.innerText)+ 1;
                    if(typeof items === 'object'){
                      for (let i = 0; i < items.length; i++) {
                        if(items[i].id === obj.imdb_code){
                          items[i].val[2] = nc;
                          break;
                        }
                      }
                      ls.set('hit_items', items)
                    }
                    dislike_cnt.innerText = nc;
                  }
                })
              }
            }
          },'Dislike', h('i.icon-thumbs-down.ml-1'))
        )

      }


    } else {
      m_img = b_img;
      torrent_spec.append(h('p.text-warning', 'Torrent specs unavailable offline'))
      comments_div.append(h('p.text-warning', 'Cannot access comments offline'))
    }

    if(img_cache.value().indexOf(obj.img) !== -1){
      m_img = urls.cache_jpg.replace('{{id}}', obj.img);
    }

    if(!obj.rt_percent && !obj.rt_audience && ss.get('is_online')){
      utils.rt_spec(obj.title, function(err,res){
        if(err){return cl(err)}
        ico_row.append(
          h('div.col-3.mb-2', {
            title: 'rottentomatoes rating'
          },h('i.icon-rt_alt.mr-2.mb-2.text-success'), res.rt_percent || 'N/A'),
          h('div.col-3.mb-2', {
            title: 'rottentomatoes audience rating'
          },h('i.icon-rt.mr-2.mb-2.text-success'), res.rt_audience || 'N/A')
        )

        obj.rt_percent = res.rt_percent || 'N/A';
        obj.rt_audience = res.rt_audience || 'N/A';
        movie_db.find({id: obj.id}).set(obj).write();

      })
    } else if(obj.rt_percent || obj.rt_audience){
      cd('rt ratings found!')
      ico_row.append(
        h('div.col-3.mb-2', {
          title: 'rottentomatoes rating'
        },h('i.icon-rt_alt.mr-2.mb-2.text-success'), obj.rt_percent || 'N/A'),
        h('div.col-3.mb-2', {
          title: 'rottentomatoes audience rating'
        },h('i.icon-rt.mr-2.mb-2.text-success'), obj.rt_audience || 'N/A')
      )
    }


    let item = h('div.row',
      h('div.col-sm-12.col-md-4.text-center',
        h('img.img-fluid.lg-img.cz.sh-95', {
          src: m_img || b_img,
          alt: obj.title,
          onerror: function(evt){
            evt.target.src = b_img;
          },
          onload: function(evt){
            if(ss.get('is_online')){
              evt.target.onclick = function(){
                window.dispatchEvent(
                  new CustomEvent('lb-open', {
                    detail: obj.img
                  })
                );
              }
            }
          }
        }),
        tr_div,
        h('button.btn.btn-outline-success.mt-3',{
          type: 'button',
          onclick: function(evt){
            if(ss.get('is_online')){
              tr_div.append(tpl.yt_trailer(obj.yt_trailer_code))
              tr_div.classList.remove('hidden');
              evt.target.remove();
            } else {
              utils.toast('warning', 'Cannot view trailer offline')
            }
          }
        }, h('span.mr-2.icon-play-circle'), 'Watch Trailer'),
        h('hr.mt-4'),
        h('h4.mb-4', 'Suggested movies'),
        function(){
          let item_row = h('div.row');
          for (let i = 0; i < obj.suggest.length; i++) {
            item_row.append(tpl.item_suggest(obj.suggest[i]))
          }
          return item_row;
        },
        h('hr'),
        h('h4.mb-4', 'Recently viewed'),
        function(){
          let rviewed = his_db.take(4).value(),
          item_row = h('div.row');
          for (let i = 0; i < rviewed.length; i++) {
            item_row.append(tpl.item_suggest(rviewed[i]))
          }
          rviewed = null;
          return item_row;
        }
      ),
      h('div.col-sm-12.col-md-8',
        h('div.w-100.mb-2',
          h('button.btn.btn-outline-success',{
            type: 'button',
            onclick: function(){
              window.history.back()
            }
          }, h('i.mr-2.icon-chevron-left'), 'Back'),
          h('button.btn.btn-outline-success.ml-2',{
            type: 'button',
            onclick: function(){
              window.dispatchEvent(new Event('hashchange'));
            }
          }, h('i.mr-2.icon-redo-alt'), 'Refresh'),
          h('button.btn.btn-outline-success.float-right',{
            type: 'button',
            onclick: function(){
              let db_item = save_db.find({id: obj.id}).value();
              utils.add_spn(this.lastChild, 'Saving...')
              if(!db_item){
                save_db.unshift(obj).write();
                if(save_db.size().value() > config.settings.saved_max){
                  save_db.pop().write();
                }
                utils.toast('info', 'item saved to db');
              } else {
                utils.toast('info', 'item already saved in db');
              }
              return utils.remove_spn(this.lastChild, 'Save')
            }
          }, h('i.mr-2.icon-star'), h('span','Save'))
        ),
        h('h3', obj.title + ' (' + obj.year + ')'),
        function(){
          let genres = h('h4.mb3');
          for (let i = 0; i < obj.genres.length; i++) {
            genres.append(h('span.text-success.genre-lnk.sh-9', {
              onclick: function(){
                pag_db.set(
                  'search',
                  movie_db.filter(function(o){
                    let item = o.genres;
                    if(item.indexOf(obj.genres[i]) !== -1){
                      return o;
                    }
                  })
                  .orderBy(['rating'], ['desc'])
                  .chunk(20).value()
                ).write();
                ss.set('pag-current', 1);
                ss.set('search_url', ['genre', obj.genres[i]])
                location.hash = 'search/'+ obj.genres[i]
              }
            },obj.genres[i]))
            if(i !== obj.genres.length -1){
              genres.append(' / ')
            }
          }
          return genres;
        },
        h('hr'),
        ico_row,
        like_div,
        h('hr'),
        h('h6.text-success.w-100.mt-2', h('span.icon-cloud-download-alt.mr-2'),  'Torrent'),
        function(){
          let lnks = c_div.cloneNode();
          for (let i = 0; i < obj.torrents.length; i++) {
            hash_arr.push(obj.torrents[i].hash)
            let txt = [obj.torrents[i].quality, obj.torrents[i].type].join(' ');
            lnks.append(h('button.btn.btn-outline-success.mr-2.mb-2.sh-95', {
              onclick: function(evt){
                let $this = this;

                utils.add_spn($this.lastChild, 'Generating...');

                const m2t = new Magnet2torrent({
                    trackers: config.trackers,
                    addTrackersToTorrent: true
                });

                m2t.getTorrent(obj.torrents[i].hash).then(function(torrent){
                    let dest = './downloads/torrent/'+ torrent.name +'.torrent';
                    fs.writeFile(dest, torrent.toTorrentFile(), function(err){
                      if(err){
                        utils.toast('danger', 'torrent gen failed')
                      } else {
                        utils.toast('success', 'torrent gen success')
                      }
                      utils.remove_spn($this.lastChild, txt);
                    });
                }).catch(function(e){
                    utils.toast('danger', 'torrent gen failed')
                    utils.remove_spn($this.lastChild, txt);
                });

              },
              title: 'size: '+ obj.torrents[i].size
            }, h('span', txt)))
          }
          return lnks;
        },
        h('h6.text-success.w-100.mt-2', h('span.icon-magnet.mr-2'), 'Magnet'),
        function(){
          let lnks = c_div.cloneNode();

          for (let i = 0; i < obj.torrents.length; i++) {
            let mag = 'magnet:?xt=urn:btih:'+ obj.torrents[i].hash +
            '&dn='+ encodeURIComponent(obj.title_long) +
            '&tr=' + config.trackers.join('&tr='),
            txt = [obj.torrents[i].quality, obj.torrents[i].type].join(' ');
            lnks.append(h('button.btn.btn-outline-success.mr-2.sh-95', {
              target: '_blank',
              href: mag,
              onclick: function(evt){
                let $this = this;
                cd(evt)
                utils.add_spn($this.lastChild, 'linking...');
                window.location = mag;
                setTimeout(function(){
                  utils.remove_spn($this.lastChild, txt)
                },1000)
              },
              title: 'size: '+ obj.torrents[i].size,
              rel: 'nofollow'
            }, h('span', txt)))
          }
          return lnks;
        },
        h('hr.mb-4'),
        torrent_spec,
        h('hr.mb-4'),
        function(){
          b_img = base_img_cache.bg_sm;
          let img_row = h('div.row'),
          sc_img = obj.img,
          d_img, l_img;
          for (let i = 1; i < 4; i++) {

            d_img = sc_img + '/medium-screenshot'+ i +'.jpg';
            l_img = sc_img + '/large-screenshot'+ i +'.jpg';

            lb_arr.push([config.yts_url, urls.img, l_img].join('/'));
            img_row.append(
              h('div.col',
                h('img.img-fluid.cz.sh-95',{
                  src: [config.yts_url, urls.img, d_img].join('/'),
                  onerror: function(evt){
                    evt.target.src = b_img;
                  },
                  onload: function(evt){
                    if(ss.get('is_online')){
                      evt.target.onclick = function(){
                        lightbox.open();
                        lightbox.currentSlide(i);
                      }
                    }
                  }
                })
              )
            )

          }
          return img_row;
        },
        h('hr.mt-4'),
        h('h4', 'Cast'),
        function(){
          if(obj.cast && obj.cast.length > 0){
            let cast_row = h('div.row');
            for (let i = 0; i < obj.cast.length; i++) {
              cast_row.append(tpl.cast_ico(obj.cast[i]));
            }
            return cast_row;
          } else {
            return h('p.col', 'no cast data available.');
          }
        },
        h('div.row',
          h('div.col-md-6',
            h('h6.mt-4', 'Director:',
              h('em.text-success.cp.sh-95.position-absolute.ml-2', {
                onclick: function(){
                  pag_db.set(
                    'search',
                    movie_db.filter(function(o){
                      if(o.director === obj.director){
                        return o;
                      }
                    })
                    .orderBy(['rating'], ['desc'])
                    .chunk(20).value()
                  ).write();
                  ss.set('pag-current', 1)

                  location.hash = 'search/director/'+ obj.director
                }
              }, obj.director || 'N/A')
            )
          ),
          h('div.col-md-6',
            h('h6.mt-4', 'Writter:',
              h('em.text-success.cp.sh-95.position-absolute.ml-2', {
                onclick: function(){
                  pag_db.set(
                    'search',
                    movie_db.filter(function(o){
                      if(o.writter === obj.writter){
                        return o;
                      }
                    })
                    .orderBy(['rating'], ['desc'])
                    .chunk(20).value()
                  ).write();
                  ss.set('pag-current', 1)

                  location.hash = 'search/writter/'+ obj.writter
                }
              }, obj.writter || 'N/A')
            )
          )
        ),
        h('hr.mt-4'),
        h('h4.mt-4.container-fluid', 'Synopsis',
          h('span.icon-eye.text-success.float-right.cp.sh-9', {
            title: 'show subtitles',
            onclick: function(evt){
              syn.classList.toggle('hidden')
            }
          })
        ),
        syn,
        h('hr.mt-4'),
        h('h4.mt-4.container-fluid', 'Subtitles',
          h('span.icon-eye.text-success.float-right.cp.sh-9', {
            title: 'show subtitles',
            onclick: function(){
              rev_div.classList.toggle('hidden')
            }
          })
        ),
        rev_div,
        h('hr.mt-4'),
        h('h4.mt-4.container-fluid', 'Reviews',
          h('span.icon-eye.text-success.float-right.cp.sh-9', {
            title: 'show reviews',
            onclick: function(){
              reviews_div.classList.toggle('hidden')
            }
          })
        ),
        reviews_div,
        h('hr.mt-4'),
        h('h4.mt-4.container-fluid', 'Comments',
          h('span.icon-eye.text-success.float-right.cp.sh-9', {
            title: 'show comments',
            onclick: function(){
              comments_div.classList.toggle('hidden')
            }
          })
        ),
        comments_div
      )
    )

    function scrap(x){

      utils.scrap_movie(x,hash_arr,function(err,res){
          if(err){
            scrap_cnt++
            if(scrap_cnt < config.trackers.length){
              return scrap(scrap_cnt);
            } else {
              utils.emptySync(torrent_spec);
              return torrent_spec.append(
                h('h5', 'Torrent specs'),
                h('h6', "All Trackers",
                  h('span.text-danger.ml-2', 'failed')
                )
              )
            }

          }

          let scrap_div = h('div',
          h('h5', 'Torrent specs'),
            h('h6.mb-4', "Tracker: "+ config.trackers[scrap_cnt],
              h('span.text-success.ml-2', 'success')
            )
          );


          for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < obj.torrents.length; j++) {

              if(obj.torrents[j].hash.toUpperCase() === res[i].infoHash.toUpperCase()){
                scrap_div.append(
                  h('div.row',
                    h('div.col-3',
                      h('h6.text-success', [obj.torrents[j].quality, obj.torrents[j].type].join(' '))
                    ),
                    h('div.col-3',
                      h('i.icon-download.mr-2.mb-2.text-success',{
                        title: 'downloads'
                      }),
                      h('span.text-success', res[i].downloaded)
                    ),
                    h('div.col-3', 'seeds: ',
                      h('span.text-success', res[i].complete)
                    ),
                    h('div.col-3', 'leechers: ',
                      h('span.text-success', res[i].incomplete)
                    )
                  )
                )
              }
            }
          }
          utils.emptySync(torrent_spec);
          torrent_spec.append(scrap_div);
        }
      )
    }


    if(config.settings.subtitles){
      if(!config.settings.subs_cache || subs_cache.value().indexOf(obj.id) === -1 && ss.get('is_online')){
        utils.fetch_subs([config.sub_url, 'movie-imdb', obj.imdb_code].join('/'),
        function(err,res){
          if(err){return cl(err)}
          let items = new DOMParser(),
          arr = [],
          subs_obj,ttl;
          try {
            items = items.parseFromString(res, "text/html");
            items = items.querySelector('.other-subs > tbody').children;

            for (let i = 0; i < items.length; i++) {
              if(
                items[i].getElementsByClassName('sub-lang')[0].innerText.toLowerCase() === config.settings.subtitle_lang
              ){
                ttl = items[i].children[2].firstChild.href.split('/').pop();
                subs_obj = {
                  lang: config.settings.subtitle_lang,
                  rating: items[i].firstChild.firstChild.innerText,
                  title: ttl,
                  link: [config.sub_url, 'subtitle',  ttl + '.zip'].join('/')
                }
                sub_div.append(tpl.sub_item(subs_obj));
                arr.push(subs_obj)
              }
            }
            if(arr.length > 0){
              fs.writeFileSync([base_dir, urls.subs, obj.id +'.json'].join('/'), JSON.stringify(arr))
              subs_cache.push(obj.id).write();
              cd('subs cached')
            } else {
              sub_div.append(h('p', 'No subs posted for this movie in '+ config.settings.subtitle_lang +' yet.'))
            }
            return rev_div.append(sub_div);
          } catch (err) {
            if(err){
              rev_div.append(h('p','No subs posted for this movie in '+ config.settings.subtitle_lang +' yet.'));
            }
          }
        })
      } else if(config.settings.subs_cache && subs_cache.value().indexOf(obj.id) !== -1){
        let items = jp(fs.readFileSync([base_dir, urls.subs, obj.id +'.json'].join('/'), 'utf8'));
        for (let i = 0; i < items.length; i++) {
          sub_div.append(tpl.sub_item(items[i]));
        }
        cd('subs loaded from cache')
        rev_div.append(sub_div);
      } else {
        rev_div.append(h('p.text-warning','Subtitles unavailable offline'));
      }
    } else {
      rev_div.append(h('p','Subtitles disabled'));
    }

    if(ls.get('bl') || config.bl){
      reviews_div.append(
        h('p.text-danger','Your ip has been blacklisted.'),
        utils.mailto('ip-blacklist')
      )
    } else {
      if(config.settings.reviews){
        if(!config.settings.reviews_cache || reviews_cache.value().indexOf(obj.id) === -1 && ss.get('is_online')){
          utils.getJSON([config.review_base, obj.imdb_code +'.json'].join('/'), function(err,res){
            if(err || typeof res !== 'object'){
              return cd('failed to fetch comments')
            }

            if(res.length > 0){
              fs.writeFileSync([base_dir, urls.reviews, obj.id +'.json'].join('/'), js(res))
              reviews_cache.push(obj.id).write();
              cd('reviews cached')
              for (let i = 0; i < res.length; i++) {
                reviews_div.append(tpl.review_item(res[i]))
              }
            } else {
              reviews_div.append(h('p', 'No reviews posted for this movie yet.'))
            }

          })
        } else if(config.settings.reviews_cache && reviews_cache.value().indexOf(obj.id) !== -1) {
          let items = jp(fs.readFileSync([base_dir, urls.reviews, obj.id +'.json'].join('/'), 'utf8'));
          for (let i = 0; i < items.length; i++) {
            reviews_div.append(tpl.review_item(items[i]));
          }
          cd('reviews loaded from cache')
        } else {
          reviews_div.append(h('p.text-warning','Uncached reviews unavalable offline'));
        }
      } else {
        reviews_div.append(h('p','Reviews disabled'));
      }
    }


    if(ss.get('is_online')){
      scrap(0);
      lightbox.init(lb_arr);
    }

    return item;
  },
  review_item: function(obj){

    let rev_txt = h('p.mb-3');
    rev_txt.innerHTML = obj.review;

    return h('div.list-group-item',
      h('div.row',
        h('div.col-md-6',
          h('h5.text-success', obj.title)
        ),
        h('div.col-md-6.text-right',
          h('span.mr-2',
            h('span.icon-star.mr-1.text-success.ch',{
              title: 'Reviewers personal rating'
            }),
            function(){
              if(obj.rating){
                return obj.rating + '/10'
              } else {
                return 'N/A'
              }
            }
          ),
          h('span',
            h('span.icon-heart.mr-1.text-success.ch',{
              title: 'Review likes'
            }),
            function(){
              if(obj.rank && obj.rank.length === 2){
                return [obj.rank[0],obj.rank[1]].join('/')
              } else {
                return 'N/A'
              }
            }
          )
        )
      ),
      h('hr'),
      rev_txt,
      h('div.row',
        h('div.col-md-6',
          h('em.mt-1',
            h('i.icon-user.mr-2.text-success.ch',{
              title: 'user'
            }),
            obj.user || 'N/A'
          )
        ),
        h('div.col-md-6.text-right',
          h('em.mt-1',
            h('i.icon-calendar.mr-2.text-success.ch',{
              title: 'Review date'
            }),
            obj.date || 'N/A'
          )
        )
      ),
      h('hr'),
      h('hr')
    )
  },
  cast_ico: function(obj){
    let b_img = base_img_cache.bg_thumb,
    c_img;
    if(!obj.url_small_image || !ss.get('is_online')){
      c_img = b_img;
    } else {
      c_img = [config.yts_url, urls.actors, obj.url_small_image].join('/')
    }
    return h('div.col-md-3.col-sm-6',
      h('div.media',
        h('img.rounded.mr-2.mb-2.img-thumbnail.border-success.sh-95',{
          src: c_img,
          onerror: function(evt){
            evt.target.src = b_img;
          }
        }),
        h('div.media-body',
          h('h6.mt-0.cp.sh-95.text-success', {
            onclick: function(){
              pag_db.set(
                'search',
                movie_db.filter(function(o){
                  let items = o.cast;
                  for (let i = 0; i < items.length; i++) {
                    if(items[i].name === obj.name){
                      return o;
                    }
                  }
                })
                .orderBy(['rating'], ['desc'])
                .chunk(20).value()
              ).write();
              ss.set('pag-current', 1)
              ss.set('search_url', ['cast', obj.name])
              location.hash = 'search/cast/'+ obj.name
            }
          }, obj.name),
          h('small', 'as '+ obj.character_name)
        )
      )
    )
  },
  quick_item: function(obj){
    let b_img = base_img_cache.bg_xs,
    s_img;

    if(ss.get('is_online')){
      s_img = [config.yts_url, urls.img, [obj.img, urls.cover_s].join('/')].join('/')
    } else {
      s_img = b_img;
    }

    return h('div.media.qs_item.cp',
      h('img.rounded.mr-2',{
        src: s_img,
        onerror: function(evt){
          evt.target.src = b_img;
        }
      }),
      h('div.media-body',
        h('h6.mt-0.sh-95', {
          onclick: function(evt){
            evt.target.parentNode.parentNode.parentNode.classList.add('hidden');
            location.hash = 'movie/'+ obj.id;
          }
        }, obj.title),
        h('small', obj.year)
      )
    )
  },
  gooey_ldr: function(){
    return h('div.loader-mask',
      h('div.loader',
        h('div.loader__ball.loader__ball--big'),
        h('div.loader__ball.loader__ball--small')
      )
    )
  },
  cat_cloud: function(){
    let item = h('div.card-body.text-center')

    for (let i = 1; i < config.search.genre.length; i++) {
      item.append(
        h('button.btn.btn-outline-success.btn-sm.fs-7.mr-2.mb-2.sh-95',{
          type: 'button',
          onclick: function(){
            pag_db.set(
              'search',
              movie_db.filter(function(o){
                let item = o.genres;
                if(item.indexOf(config.search.genre[i]) !== -1){
                  return o;
                }
              })
              .orderBy(['rating'], ['desc'])
              .chunk(20).value()
            ).write();
            ss.set('pag-current', 1)
            ss.set('search_url', ['genre', config.search.genre[i]])
            location.hash = 'search/'+ config.search.genre[i];
          }
        }, config.search.genre[i])
      )
    }
    return h('div.card.bg-dark.bd-dark.mb-4',
      h('div.card-header.text-center', 'Genres'),
      item
    );
  },
  actor_cloud: function(){
    let sp = jp(fs.readFileSync(base_dir + urls.staff_popular_db, 'utf8')),
    item = h('div.card-body.text-center'),
    actors = _.shuffle(sp.cast).slice(0,20);
    sp = null;

    for (let i = 1; i < actors.length; i++) {
      item.append(
        h('button.btn.btn-outline-success.btn-sm.fs-7.mr-2.mb-2.sh-95',{
          type: 'button',
          onclick: function(){
            pag_db.set(
              'search',
              movie_db.filter(function(o){
                let items = o.cast;
                for (let x = 0; x < items.length; x++) {
                  if(items[x].name === actors[i].n){
                    return o;
                  }
                }
              })
              .orderBy(['rating'], ['desc'])
              .chunk(20).value()
            ).write();
            ss.set('pag-current', 1)
            ss.set('search_url', ['cast', actors[i].n])
            location.hash = 'search/cast/'+ actors[i].n
          }
        }, actors[i].n)
      )
    }
    return h('div.card.bg-dark.bd-dark.mb-4',
      h('div.card-header.text-center', 'Popular Actors'),
      item
    );
  },
  director_cloud: function(){
    let sp = jp(fs.readFileSync(base_dir + urls.staff_popular_db, 'utf8')),
    item = h('div.card-body.text-center'),
    directors = _.shuffle(sp.directors).slice(0,20);
    sp = null;

    for (let i = 1; i < directors.length; i++) {
      item.append(
        h('button.btn.btn-outline-success.btn-sm.fs-7.mr-2.mb-2.sh-95',{
          type: 'button',
          onclick: function(){
            pag_db.set(
              'search',
              movie_db.filter(function(o){
                if(o.director === directors[i]){
                  return o;
                }
              })
              .orderBy(['rating'], ['desc'])
              .chunk(20).value()
            ).write();
            ss.set('pag-current', 1)
            location.hash = 'search/director/'+ directors[i]
            ss.set('search_url', ['director', directors[i]])
          }
        }, directors[i])
      )
    }
    return h('div.card.bg-dark.bd-dark.mb-4',
      h('div.card-header.text-center', 'Popular Directors'),
      item
    );
  },
  yt_trailer: function(i){
    let item = h('iframe.tr-iframe',{
      frameBorder: 0,
      allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
      src: config.trailer_url.replace('{{id}}', i)
    })

    item.setAttribute('allowfullscreen', '');

    return item
  },
  sub_item: function(obj){
    return h('div.list-group-item',
      h('div.row',
        h('div.col-2', {title: 'rating'}, h('i.icon-star.mr-2.text-success'), obj.rating),
        h('div.col-2', {title: 'language'}, h('i.icon-language.mr-2.text-success'),obj.lang),
        h('div.col-6', {title: obj.title},h('p.text-truncate', obj.title)),
        h('div.col-2.text-right', h('a.icon-cloud-download-alt', {
          href: obj.link,
          title: 'download subtitle'
        }))
      )
    )
  },
  show_all_btn: function(i){
    return h('div.col-12.text-center',
      h('button.btn.btn-outline-success.mt-2.mb-4.sh-95.w-50',{
        type: 'button',
        onclick: function(){
          location.hash = i
        }
      }, 'Show All')
    )
  },
  cast_btn: function(i){
    return h('button.btn.btn-outline-success.btn-sm.fs-7.mr-2.mb-2.sh-95',{
      type: 'button',
      onclick: function(){
        pag_db.set(
          'search',
          movie_db.filter(function(o){
            let items = o.cast;
            for (let x = 0; x < items.length; x++) {
              if(items[x].name === i){
                return o;
              }
            }
          })
          .orderBy(['rating'], ['desc'])
          .chunk(20).value()
        ).write();
        ss.set('pag-current', 1)
        ss.set('search_url', ['cast', i])
        location.hash = 'search/cast/'+ i
      }
    }, i)
  },
  crew_btn: function(i,e){
    return h('button.btn.btn-outline-success.btn-sm.fs-7.mr-2.mb-2.sh-95',{
      type: 'button',
      onclick: function(){
        pag_db.set(
          'search',
          movie_db.filter(function(o){
            if(o[e] === i){
              return o;
            }
          })
          .orderBy(['rating'], ['desc'])
          .chunk(20).value()
        ).write();
        ss.set('pag-current', 1)
        ss.set('search_url', [e, i])
        location.hash = ['search', e, i].join('/')
      }
    }, i)
  },
  glide_arrow: function(){
    return h('div.glide__arrows',{
        'data-glide-el': 'controls'
      },
      h('button.glide__arrow.glide__arrow--left',{
        'data-glide-dir': '<'
      }, 'Prev'),
      h('button.float-right.glide__arrow.glide__arrow--right',{
        'data-glide-dir': '>'
      }, 'Next')
    )
  },
  jump_to: function(max, current, items){

    let inp = h('input.form-control.inp-dark',{
      type: 'number',
      min: 1,
      max: max,
      value: current,
      onkeyup: function(){
        let val = parseInt(this.value);
        if(val < 1){
          this.value = 1
        } else if(val > max){
          this.value = max
        } else {
          this.value = val;
        }
      }
    });

    return h('div.input-group',
      inp,
      h('div.input-group-append',
        h('button.btn.btn-outline-success', {
          onclick: function(){
            let val = inp.value;
            if(val !== ''){
              val = parseInt(val);
              pagination.page_to(max, items, val)
            }
          }
        }, 'Jump to')
      )
    )
  },
  contact: function(dest){
    if(ss.get('is_online') === true){
      if(ls.get('bl') || config.bl){
        return dest.append(
          h('p.text-danger','Your ip has been blacklisted.'),
          utils.mailto('ip-blacklist')
        )
      }
      ss.set('msg_stat', false);
      utils.fetch(config.contact.config, function(err,res){
        if(err){
          return ce(err)
        }

        let kc_arr = ['rsa_oaep', 'ecdh', 'ecdsa'];

        for (let i = 0; i < kc_arr.length; i++) {
          if(!db.get(kc_arr[i] +'_keychain').find(res[kc_arr[i]]).value()){
            db.get(kc_arr[i] +'_keychain').push(res[kc_arr[i]]).write();
            ls.set(kc_arr[i] +'_sel', db.get(kc_arr[i] +'_keychain').size().value() -1)
            cd('new '+ kc_arr[i] +' key added to keychain')
          } else {
            if(!ls.get(kc_arr[i] +'_sel')){
              ls.set(kc_arr[i] +'_sel', db.get(kc_arr[i] +'_keychain').size().value() -1)
            }
          }
        }

        let yts_ecdh = db.get('ecdh_keychain').value()[ls.get('ecdh_sel')],
        yts_ecdsa = db.get('ecdsa_keychain').value()[ls.get('ecdsa_sel')],
        yts_rsa_oaep = db.get('rsa_oaep_keychain').value()[ls.get('rsa_oaep_sel')]
        ecdh_public = db.get('crypto.ecdh_public').value(),
        ecdh_private = db.get('crypto.ecdh_private').value(),
        ecdsa_public = db.get('crypto.ecdsa_public').value(),
        ecdsa_private = db.get('crypto.ecdsa_private').value(),
        inbox_data = db.get('inbox').value();
        msg_obj = {};

        enc.ecdh_derive(yts_ecdh.public, ecdh_private, function(err, mail_key){
          if(err){return ce(err)}
          let contact_base = h('div'),
          key_inp = h('input.form-control.inp-dark.mb-2.ch',{
            value: mail_key,
            type: 'password'
          }),
          key_res = h('textarea.form-control.inp-dark.mb-2.sec-txt',{
            placeholder: 'secure message',
            readOnly: true,
            rows: 5
          }),
          obj = {
            pbk: ecdh_public,
            pbs: ecdsa_public,
            pbk_fp: yts_ecdh.fp,
            pbs_fp: yts_ecdsa.fp
          },
          name_inp = h('input.form-control.inp-dark.mb-2',{
            placeholder: 'name',
            onkeyup: utils.debounce(function(evt) {
              obj.name = evt.target.value;
              enc.enc_contact(obj, mail_key, ecdsa_private, key_res);
            },2000)
          }),
          subject_inp = h('input.form-control.inp-dark.mb-2',{
            placeholder: 'subject',
            onkeyup: utils.debounce(function(evt) {
              obj.subject = evt.target.value;
              enc.enc_contact(obj, mail_key, ecdsa_private, key_res);
            },2000)
          }),
          msg_inp = h('textarea.form-control.inp-dark.mb-2',{
            placeholder: 'plaintext message',
            rows: 10,
            onkeyup: utils.debounce(function(evt) {
              obj.msg = evt.target.value;
              enc.enc_contact(obj, mail_key, ecdsa_private, key_res);
            },2000)
          }),
          commit_btn = h('button.btn.btn-block.btn-outline-success.mb-2.sh-95', {
            onclick: function(evt){
              if(ss.get('msg_stat')){
                let msg = jp(key_res.value);
                msgbox.send(msg ,function(err, res){
                  if(err){
                    utils.toast('danger', 'commit failed');
                    return cl(err)
                  }

                  evt.target.setAttribute('disabled', true);
                  name_inp.setAttribute('disabled', true);
                  name_inp.onkeyup = null;
                  subject_inp.setAttribute('disabled', true);
                  subject_inp.onkeyup = null;
                  msg_inp.setAttribute('disabled', true);
                  msg_inp.onkeyup = null;
                  send_btn.removeAttribute('disabled');
                  utils.toast('success', 'commit success');
                  msg_obj.id = res.id

                })

              } else {
                utils.toast('danger', 'invalid msg');
                //send data to server
              }
            }
          },'Commit'),
          send_btn = h('button.btn.btn-block.btn-outline-success.mb-2.sh-95', {
            disabled: true,
            onclick: function(evt){

              msg_obj.src = db.get('outbox').value().id;
              msg_obj.dest = inbox_data.id;
              msg_obj.api = inbox_data.api;

              enc.rsa_oaep_enc(yts_rsa_oaep.public, js(msg_obj), function(err,res){
                if(err){return cl(err)}
                cl({data: res, fp: yts_rsa_oaep.fp})
                fetch(urls.dev_counter +'/message', {
                  method: 'POST',
                  headers: headers.json_cors,
                  body: js({
                    api: config.api.mtk,
                    data: {
                      msg: res, fp: yts_rsa_oaep.fp
                    }
                  })
                })
                .then(function(res){
                  if (res.status >= 200 && res.status < 300) {
                    return res.json();
                  } else {
                    return Promise.reject(new Error(res.statusText))
                  }
                })
                .then(function(data) {

                  if(data.status === 'success'){
                    utils.toast('success', data.msg)
                    evt.target.remove()
                  } else {
                    utils.toast('danger', data.msg)
                  }

                  if(data.status === 'blacklisted'){
                    evt.target.remove()
                    ls.set('bl',true);
                    utils.bl();
                    location.hash = '/contact/blacklisted'
                  }

                })
                .catch(function(err){
                  cl(err)
                })
              })

            }
          },'Send')


          create_msg = h('div.row',
            h('div.col-md-6',
            h('h4.mb-4', 'Create messege'),
              h('div.form-group',
                name_inp,
                subject_inp,
                msg_inp
              )
            ),
            h('div.col-md-6',
              h('div.row',
                h('div.col-4',
                  h('div.form-group',
                    h('label.text-success', 'cipher'),
                    h('input.form-control.inp-dark.mb-2.ch',{
                      readOnly: true,
                      value: [enc.defaults.cipher, enc.defaults.bit_len, 'GCM'].join('-').toUpperCase()
                    })
                  )
                ),
                h('div.col-4',
                  h('div.form-group',
                    h('label.text-success', 'key exchange'),
                    h('input.form-control.inp-dark.mb-2.ch',{
                      readOnly: true,
                      value: ['ECDH', enc.defaults.ec.curve].join(' ')
                    })
                  )
                ),
                h('div.col-4',
                  h('div.form-group',
                    h('label.text-success', 'signature'),
                    h('input.form-control.inp-dark.mb-2.ch',{
                      readOnly: true,
                      value: ['ECDSA', enc.defaults.ec.curve].join(' ')
                    })
                  )
                ),
                h('div.col-4',
                  h('div.form-group',
                    h('label.text-success', 'KDF'),
                    h('input.form-control.inp-dark.mb-2.ch',{
                      readOnly: true,
                      title: 'key derivation function',
                      value: 'Scrypt'
                    })
                  )
                ),
                h('div.col-4',
                  h('div.form-group',
                    h('label.text-success', 'hash'),
                    h('input.form-control.inp-dark.mb-2.ch',{
                      readOnly: true,
                      value: enc.defaults.digest
                    })
                  )
                ),
                h('div.col-4',
                  h('div.form-group.text-success',
                    h('label.w-100', 'crypto key',
                      h('i.icon-eye.float-right', {
                        onclick: function(){
                          if(key_inp.type === 'password'){
                            key_inp.type = 'text'
                          } else {
                            key_inp.type = 'password'
                          }
                        }
                      })
                    ),
                    key_inp
                  )
                )
              ),
              h('div.form-group.text-success',
                h('h5', 'encrypted message',
                  h('span.icon-eye.float-right',{
                    onclick: function(){
                      key_res.classList.toggle('sec-txt');
                    }
                  })
                ),
                key_res
              ),
              h('div.row',
                h('div.col-6',
                  commit_btn
                ),
                h('div.col-6',
                  send_btn
                )
              )
            )
          )
          inbox_msg = h('div.row',
            h('div.col-12',
              h('h4', 'Inbox')
            )
          ),
          outbox_msg = h('div.row',
            h('div.col-12',
              h('h4', 'Outbox')
            )
          ),
          msg_main = h('div', create_msg);

          contact_base.append(
            h('div.row',
              h('div.col-4',
                h('button.btn.btn-block.btn-outline-success.mb-2.sh-95', {
                  onclick: function(){
                    utils.empty(msg_main, function(){
                      msg_main.append(create_msg)
                    })
                  }
                },'Create'),
              ),
              h('div.col-4',
                h('button.btn.btn-block.btn-outline-success.mb-2.sh-95', {
                  onclick: function(){
                    utils.empty(msg_main, function(){
                      msg_main.append(inbox_msg)
                    })
                  }
                },'Inbox'),
              ),
              h('div.col-4',
                h('button.btn.btn-block.btn-outline-success.mb-2.sh-95', {
                  onclick: function(){
                    utils.empty(msg_main, function(){
                      msg_main.append(outbox_msg)
                    })
                  }
                },'Outbox'),
              ),
              h('div.col-12',
                h('hr.w-100.mb-4')
              )
            ),
            msg_main
          )

          dest.append(contact_base)
        })
      })

    } else {
      dest.append(h('p', 'offline while offline.'))
    }
  },
  msg_create: function(){

  }
}

module.exports = tpl;
