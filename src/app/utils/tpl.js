const config = require('../config'),
fs = require('fs'),
h = require('./h'),
_ = require('lodash'),
request = require('request'),
urls = require('./urls'),
rout = require('./rout'),
{ls,ss} = require('./storage'),
lightbox = require('./lightbox'),
sp = require('../db/staff_popular');

let cnt = 0;
const tpl = {
  header: function(){
    return h('nav.navbar.navbar-expand-lg.nav_main.fixed-top',
      h('div.row.w-100',
        h('div.col-md-3.col-6',
          h('div.navbar-brand',
            h('img.nav_logo',{
              src:config.settings.logo
            })
          )
        ),
        h('div.col-md-9.col-6',
          h('div.w-100',
            h('div.input-group.float-right',
              h('input.form-control.inp-dark',{
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
      img.firstChild.src = [config.yts_url, urls.img, [evt, urls.cover_l].join('/')].join('/')
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
          src:config.settings.logo
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
  item_post: function(obj){
    let genre = h('div'),
    b_img = urls.bg_med,
    c_img = [config.yts_url, urls.img, [obj.img, urls.cover_m].join('/')].join('/'),
    m_img = h('img.img-fluid',{
      alt: obj.title,
      width: 210,
      height: 315
    })
    if(obj.genres){
      for (let i = 0; i < 2; i++) {
        if(obj.genres[i]){
          genre.append(h('h4', obj.genres[i]))
        }
      }
    }

    if(config.settings.img_cache){
      if(img_cache.value().indexOf(obj.img) === -1){
        m_img.src = c_img;
        m_img.onload = function(ele){
          utils.cache_img(c_img)
        }
      } else {
        m_img.src = urls.cache_jpg.replace('{{id}}', obj.img);
      }
      m_img.onerror = function(evt){
        evt.target.src = b_img;
      }
    } else {
      m_img.src = c_img;
    }


    return h('div.col-xs-12.col-sm-6.col-md-3.text-center',
      h('div.browse-movie-wrap',
        h('div.browse-movie-link',
          h('figure',
            m_img
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
    let genre = h('div'),
    b_img = urls.bg_med,
    c_img = [config.yts_url, urls.img, [obj.img, urls.cover_m].join('/')].join('/'),
    m_img = h('img.img-fluid',{
      alt: obj.title,
      width: 210,
      height: 315
    })
    if(obj.genres){
      for (let i = 0; i < 2; i++) {
        if(obj.genres[i]){
          genre.append(h('h4', obj.genres[i]))
        }
      }
    }

    if(config.settings.img_cache){
      if(img_cache.value().indexOf(obj.img) === -1){
        m_img.src = c_img;
        m_img.onload = function(ele){
          utils.cache_img(c_img)
        }
      } else {
        m_img.src = urls.cache_jpg.replace('{{id}}', obj.img);
      }
      m_img.onerror = function(evt){
        evt.target.src = b_img;
      }
    } else {
      m_img.src = c_img;
    }


    return h('div.glide__slide.text-center',
      h('div.browse-movie-wrap',
        h('div.browse-movie-link',
          h('figure',
            m_img
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
    b_img = urls.bg_med,
    c_img = [config.yts_url, urls.img, [obj.img, urls.cover_m].join('/')].join('/'),
    m_img = h('img.img-fluid',{
      alt: obj.title,
      width: 210,
      height: 315,
      onerror: function(evt){
        evt.target.src = b_img;
      }
    }),
    item;

    if(obj.genres){
      for (let i = 0; i < 2; i++) {
        if(obj.genres[i]){
          genre.append(h('h4', obj.genres[i]))
        }
      }
    }

    if(config.settings.img_cache){
      if(img_cache.value().indexOf(obj.img) === -1){
        m_img.src = c_img;
        m_img.onload = function(ele){
          utils.cache_img(c_img)
        }
      } else {
        m_img.src = urls.cache_jpg.replace('{{id}}', obj.img);
      }
    } else {
      m_img.src = c_img;
    }

    item = h('div.col-xs-12.col-sm-6.col-md-3.text-center',
      h('div.browse-movie-wrap',
        h('div.browse-movie-link',
          h('figure',
            m_img
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
  item_suggest: function(id){
    let obj = movie_db.find({id: id}).value();
    if(!obj){
      return h('span')
    }
    let b_img = urls.bg_med,
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

    if(config.settings.img_cache){
      if(img_cache.value().indexOf(obj.img) === -1){
        m_img.src = c_img;
        m_img.onload = function(ele){
          utils.cache_img(c_img)
        }
      } else {
        m_img.src = urls.cache_jpg.replace('{{id}}', obj.img);
      }
    } else {
      m_img.src = c_img;
    }

    return h('div.col-6.text-center',
      h('div.browse-movie-link.bc-hov.mb-4.cp',
        m_img
      )
    );

  },
  ico_col: function(title,ico,data){
    return h('div.col-3.mb-2', {title: title},
      h('i.icon-'+ ico +'.mr-2.mb-2.text-success'),
      data || 'N/A'
    )
  },
  item_page: function(obj){

    let lb_arr = [],
    hash_arr = [],
    scrap_cnt = 0,
    c_div = h('div'),
    rev_div = h('div.hidden'),
    b_img = urls.bg_lg,
    m_img = [config.yts_url, urls.img, [obj.img, urls.cover_m].join('/')].join('/'),
    sub_div = h('div.list-group'),
    syn = h('div.card', h('div.card-body', obj.synopsis)),
    tr_div = h('div.trailer-div.hidden.mt-4',
      tpl.yt_trailer(obj.yt_trailer_code)
    ),
    ico_row = h('div.row',
      tpl.ico_col('IMDB rating', 'imdb', obj.rating),
      tpl.ico_col('IMDB votes', 'comments', obj.votes),
      tpl.ico_col('Runtime', 'clock', obj.runtime +'min'),
      tpl.ico_col('MPA rating', 'eye', obj.mpa_rating),
      tpl.ico_col('Metacritic rating', 'metacritic', obj.metascore),
      tpl.ico_col('Cumulative Gross', 'dollar', obj.gross),
      tpl.ico_col('Upload date', 'cloud-upload-alt', utils.format_date(obj.date_uploaded)),
      tpl.ico_col('Release date', 'calendar', obj.published),
      tpl.ico_col('Language', 'language', obj.language)
    ),
    torrent_spec = h('div',
      h('h4.text-success', 'Fetching torrent specs...',
        h('span.spinner-grow.spinner-grow-sm.ml-2.sp-lg.float-right')
      )
    ),
    comments_div = h('div.iframe-container');
    comments_div.append(utils.add_comments(obj.imdb_code, 'movie', comments_div))

    if(img_cache.value().indexOf(obj.img) !== -1){
      m_img = urls.cache_jpg.replace('{{id}}', obj.img);
    }

    if(!obj.rt_percent && !obj.rt_audience){
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
    } else {
      cl('rt ratings found!')
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
        h('img.img-fluid.lg-img.cp', {
          src: m_img || b_img,
          alt: obj.title,
          onerror: function(evt){
            evt.target.src = b_img;
          },
          onclick: function(){

            window.dispatchEvent(
              new CustomEvent('lb-open', {
                detail: obj.img
              })
            );

          }
        }),
        tr_div,
        h('button.btn.btn-outline-success.mt-3',{
          type: 'button',
          onclick: function(evt){
            tr_div.classList.remove('hidden');
            evt.target.remove();
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
        h('hr'),
        h('h6.text-success.w-100.mt-2', h('span.icon-cloud-download-alt.mr-2'),  'Torrent'),
        function(){
          let lnks = c_div.cloneNode();
          for (let i = 0; i < obj.torrents.length; i++) {
            hash_arr.push(obj.torrents[i].hash)
            let txt = [obj.torrents[i].quality, obj.torrents[i].type].join(' ');
            lnks.append(h('button.btn.btn-outline-success.mr-2.mb-2.sh-95', {
              target: '_blank',
              onclick: function(evt){
                let $this = this;
                cl(evt)
                utils.add_spn($this.lastChild, 'Downloading...');
                window.location = [config.yts_url, urls.torrent, obj.torrents[i].hash].join('/');
                setTimeout(function(){
                  utils.remove_spn($this.lastChild, txt)
                },1000)
              },
              title: [
                'size: '+ obj.torrents[i].size,
                'peers: '+ obj.torrents[i].peers,
                'seeds: '+ obj.torrents[i].seeds,
              ].join(' / '),
              rel: 'nofollow'
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
                cl(evt)
                utils.add_spn($this.lastChild, 'linking...');
                window.location = mag;
                setTimeout(function(){
                  utils.remove_spn($this.lastChild, txt)
                },1000)
              },
              title: [
                'size: '+ obj.torrents[i].size,
                'peers: '+ obj.torrents[i].peers,
                'seeds: '+ obj.torrents[i].seeds,
              ].join(' / '),
              rel: 'nofollow'
            }, h('span', txt)))
          }
          return lnks;
        },
        h('hr.mb-4'),
        torrent_spec,
        h('hr.mb-4'),
        function(){
          b_img = urls.bg_sm;
          let img_row = h('div.row'),
          sc_img = obj.img,
          d_img, l_img;
          for (let i = 1; i < 4; i++) {

            d_img = sc_img + '/medium-screenshot'+ i +'.jpg';
            l_img = sc_img + '/large-screenshot'+ i +'.jpg';

            lb_arr.push([config.yts_url, urls.img, l_img].join('/'));
            img_row.append(
              h('div.col',
                h('img.img-fluid.cp',{
                  src: [config.yts_url, urls.img, d_img].join('/'),
                  onclick: function(){
                    lightbox.open();
                    lightbox.currentSlide(i);
                  },
                  onerror: function(evt){
                    evt.target.src = b_img;
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
    scrap(0);


    if(config.settings.subtitles){
      if(!config.settings.subs_cache || subs_cache.value().indexOf(obj.id) === -1){
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
              cl('subs cached')
            }
            return rev_div.append(sub_div);
          } catch (err) {
            if(err){
              rev_div.append(h('p','Subtitles not found for this movie'));
            }
          }
        })
      } else {
        let items = JSON.parse(fs.readFileSync([base_dir, urls.subs, obj.id +'.json'].join('/'), 'utf8'));
        for (let i = 0; i < items.length; i++) {
          sub_div.append(tpl.sub_item(items[i]));
        }
        cl('subs loaded from cache')
        rev_div.append(sub_div);
      }
    } else {
      rev_div.append(h('p','Subtitles disabled'));
    }

    lightbox.init(lb_arr);

    return item;
  },
  cast_ico: function(obj){
    let b_img = urls.bg_thumb,
    c_img;
    if(!obj.url_small_image){
      c_img = b_img
    } else {
      c_img = [config.yts_url, urls.actors, obj.url_small_image].join('/')
    }
    return h('div.col-md-3.col-sm-6',
      h('div.media',
        h('img.rounded.mr-2.mb-2.img-thumbnail.border-success',{
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
    let b_img = urls.bg_xs,
    s_img = [obj.img, urls.cover_s].join('/');
    return h('div.media.qs_item.cp',
      h('img.rounded.mr-2',{
        src: [config.yts_url, urls.img, s_img].join('/'),
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
    let item = h('div.card-body.text-center'),
    actors = _.shuffle(sp.cast).slice(0,20)

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
    let item = h('div.card-body.text-center'),
    directors = _.shuffle(sp.directors).slice(0,20)

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
  }
}

module.exports = tpl;
