const config = require('../config'),
h = require('./h'),
rout = require('./rout'),
{ls,ss} = require('./storage'),
lightbox = require('./lightbox');

const tpl = {
  header: function(){
    return h('nav.navbar.navbar-expand-lg.nav_main.fixed-top',
      h('div.navbar-brand',
        h('img.nav_logo',{
          src:'./static/img/logo.svg'
        })
      ),
      h('div.w-100',
        h('div.input-group.float-right',
          h('input.form-control.inp-dark',{
            placeholder: 'Search...',
            onkeyup: utils.debounce(function(evt){
              let term = this.value;
              if(term.length > 3){
                utils.quick_search(term)
              } else {
                document.getElementsByClassName('quick_search')[0].classList.add('hidden')
              }
            },3000)
          })
        )
      )
    )
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
  status_bar: function(){

    let online_globe = h('div.globe.mr-2'),
    sb = h('div.container-fluid.status-bar',
      h('div.row',
        h('div.col-6',
          h('div.status-left',
            tpl.bread_crumb()
          )
        ),
        h('div.col-6',
          h('div.status-right',
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

    window.addEventListener('online',  function(){
      utils.is_online(online_globe);
    })

    window.addEventListener('offline',  function(){
      utils.is_offline(online_globe);
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
        dest[i] = utils.capitalize(dest[i]);
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
          src:'./static/img/logo.svg'
        })
      )
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
      sb_body.append(sb_item);
    }

    return sb

  },
  base: function(){

    let quick_search = h('div.quick_search.hidden'),
    loader = tpl.gooey_ldr();

    window.addEventListener('quick_search', function(evt){
      evt = evt.detail;
      quick_search.classList.remove('hidden');

      utils.empty(quick_search, function(){
        for (let i = 0; i < evt.length; i++) {
          quick_search.append(tpl.quick_item(evt[i]))
        }
        cl(evt)
      })
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
      h('div#main-content.container-fluid',
        h('div#app-main')
      ),
      h('div.sub-content',
        h('div#myModal.lb-modal.hidden',
          h('span.lb-close.icon-times-circle', {
            onclick: function(){
              lightbox.close();
            }
          }),
          h('div#lb-main.container-fluid')
        ),
        quick_search,
        loader,
        tpl.to_top(),
        tpl.status_bar()
      )
    )
  },
  item_post: function(obj){
    let genre = h('div'),
    b_img = './static/img/bg_med.png';
    if(obj.genres){
      for (let i = 0; i < 2; i++) {
        if(obj.genres[i]){
          genre.append(h('h4', obj.genres[i]))
        }
      }
    }
    return h('div.browse-movie-wrap.col-xs-12.col-sm-6.col-md-3.text-center',
      h('div.browse-movie-link',
        h('figure',
          h('img.img-fluid',{
            src: obj.medium_cover_image || b_img,
            alt: obj.title,
            width: 210,
            height: 315,
            onerror: function(evt){
              evt.target.src = b_img;
            }
          })
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

  },
  item_sel: function(obj, sel){
    let genre = h('div'),
    b_img = './static/img/bg_med.png',
    item;
    if(obj.genres){
      for (let i = 0; i < 2; i++) {
        if(obj.genres[i]){
          genre.append(h('h4', obj.genres[i]))
        }
      }
    }
    item = h('div.browse-movie-wrap.col-xs-12.col-sm-6.col-md-3.text-center',
      h('div.browse-movie-link',
        h('figure',
          h('img.img-fluid',{
            src: obj.medium_cover_image || b_img,
            alt: obj.title,
            width: 210,
            height: 315,
            onerror: function(evt){
              evt.target.src = b_img;
            }
          })
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
    return item;
  },
  item_suggest: function(obj){
    let b_img = './static/img/bg_med.png';
    return h('div.col-6.text-center',
      h('div.browse-movie-link.bc-hov.mb-4.cp',
        h('img.img-fluid',{
          src: obj.medium_cover_image || b_img,
          alt: obj.title_long,
          title: obj.title_long,
          onclick: function(){
            location.hash = 'movie/'+ obj.id
          },
          onerror: function(evt){
            evt.target.src = b_img;
          }
        })
      )
    )
  },
  item_page: function(obj){
    cl(obj)
    let lb_arr = [],
    rev_div = h('div'),
    b_img = './static/img/bg_lg.png',
    sub_div = h('div.list-group'),
    tr_div = h('div.trailer-div.hidden.mt-4', tpl.yt_trailer(obj.yt_trailer_code));

    let item = h('div.row',
      h('div.col-sm-12.col-md-4.text-center',
        h('img.img-fluid', {
          src: obj.large_cover_image || b_img,
          alt: obj.title_long,
          onerror: function(evt){
            evt.target.src = b_img;
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
          for (let i = 0; i < obj.suggestions.length; i++) {
            item_row.append(tpl.item_suggest(obj.suggestions[i]))
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
          h('button.btn.btn-outline-success.float-right',{
            type: 'button',
            onclick: function(){
              let db_item = save_db.find({id: obj.id}).value();

              if(!db_item){
                save_db.unshift(obj).write();

                if(save_db.size().value() > config.settings.saved_max){
                  save_db.pop().write();
                }

                return utils.toast('info', 'item saved to db');

              } else {
                return utils.toast('info', 'item already saved in db');
              }

            }
          }, h('i.mr-2.icon-star'), 'Save')
        ),
        h('h3', obj.title_long),
        function(){
          let genres = h('h4.mb3');
          for (let i = 0; i < obj.genres.length; i++) {
            genres.append(h('span.text-success.genre-lnk.sh-9', {
              onclick: function(){
                ss.set('search_url', '&genre='+ encodeURIComponent(obj.genres[i]))
                location.hash = 'search/'+ obj.genres[i]
              }
            },obj.genres[i]))
            if(i !== obj.genres.length -1){
              genres.append(' / ')
            }
          }
          return genres;
        },
        h('h5.mb-4',
          h('span.mr-4', {
            title: 'like count'
          }, h('i.icon-heart.mr-2.mb-2.text-success'), obj.like_count),
          h('span.mr-4', {
            title: 'imdb rating'
          },h('i.icon-imdb.mr-2.mb-2.text-success'), obj.rating),
          h('span.mr-4', {
            title: 'download count'
          },h('i.icon-download.mr-2.mb-2.text-success'), obj.download_count),
          h('span.mr-4', {
            title: 'Runtime'
          },h('i.icon-clock.mr-2.mb-2.text-success'), obj.runtime +'min'),
          h('span.mr-4', {
            title: 'MPA rating'
          },h('i.icon-eye.mr-2.mb-2.text-success'), obj.mpa_rating),
          h('span.mr-4', {
            title: 'upload date'
          },h('i.icon-cloud-upload-alt.mr-2.mb-2.text-success'), obj.date_uploaded.split(' ')[0]),
          h('span.mr-4', {
            title: 'Language'
          },h('i.icon-language.mr-2.mb-2.text-success'), obj.language)
        ),
        h('hr'),
        h('h6.text-success.w-100.mt-2', h('span.icon-cloud-download-alt.mr-2'),  'Torrent'),
        function(){
          let lnks = h('div');
          for (let i = 0; i < obj.torrents.length; i++) {
            lnks.append(h('a.btn.btn-outline-success.mr-2.mb-2.sh-95', {
              href: obj.torrents[i].url,
              title: [
                'size: '+ obj.torrents[i].size,
                'peers: '+ obj.torrents[i].peers,
                'seeds: '+ obj.torrents[i].seeds,
              ].join(' / '),
              rel: 'nofollow'
            }, [obj.torrents[i].quality, obj.torrents[i].type].join(' ')))
          }
          return lnks;
        },
        h('h6.text-success.w-100.mt-2', h('span.icon-magnet.mr-2'), 'Magnet'),
        function(){
          let lnks = h('div'),
          mag;

          for (let i = 0; i < obj.torrents.length; i++) {
            mag = 'magnet:?xt=urn:btih:'+ obj.torrents[i].hash +
            '&dn='+ encodeURIComponent(obj.title_long) +
            '&tr=' + config.trackers.join('&tr=');

            lnks.append(h('a.btn.btn-outline-success.mr-2.sh-95', {
              href: mag,
              title: [
                'size: '+ obj.torrents[i].size,
                'peers: '+ obj.torrents[i].peers,
                'seeds: '+ obj.torrents[i].seeds,
              ].join(' / '),
              rel: 'nofollow'
            }, [obj.torrents[i].quality, obj.torrents[i].type].join(' ')))
          }
          return lnks;
        },
        h('hr.mb-4'),
        function(){
          b_img = './static/img/bg_sm.png';
          let img_row = h('div.row');
          for (let i = 1; i < 4; i++) {
            if(obj['medium_screenshot_image'+ i]){
              lb_arr.push(obj['large_screenshot_image'+ i]);
              img_row.append(
                h('div.col',
                  h('img.img-fluid.cp',{
                    src: obj['medium_screenshot_image'+ i] || b_img,
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
        h('hr.mt-4'),
        h('h4.mt-4', 'Synopsis'),
        h('p', obj.description_full),
        h('hr.mt-4'),
        h('h4.mt-4', 'Subtitles'),
        rev_div
      )
    )

    if(config.settings.subtitles){
      utils.fetch_subs('https://www.yifysubtitles.com/movie-imdb/'+ obj.imdb_code, function(err,res){
        if(err){return cl(err)}
        let items = new DOMParser(),
        arr = [],
        ttl;
        try {
          items = items.parseFromString(res, "text/html");
          items = items.querySelector('.other-subs > tbody').children;

          for (let i = 0; i < items.length; i++) {
            if(items[i].getElementsByClassName('sub-lang')[0].innerText.toLowerCase() === config.settings.subtitle_lang){
              ttl = items[i].children[2].firstChild.href.split('/').pop();
              sub_div.append(tpl.sub_item({
                lang: config.settings.subtitle_lang,
                rating: items[i].firstChild.firstChild.innerText,
                title: ttl,
                link: config.sub_url + ttl + '.zip'
              }))
            }

          }
          return rev_div.append(sub_div);
        } catch (err) {
          if(err){
            rev_div.append(h('p','Subtitles not found for this movie'));
          }
        }

      })
    } else {
      rev_div.append(h('p','Subtitles disabled'));
    }

    lightbox.init(lb_arr);

    return item;
  },
  cast_ico: function(obj){
    let b_img = './static/img/bg_thumb.png';
    return h('div.col-md-3.col-sm-6',
      h('div.media.border-success',
        h('img.rounded.mr-2.mb-2',{
          src: obj.url_small_image || b_img,
          onerror: function(evt){
            evt.target.src = b_img;
          }
        }),
        h('div.media-body',
          h('h6.mt-0.cp.sh-95', {
            onclick: function(){
              location.hash = 'search/character/'+ encodeURIComponent(obj.name)
            }
          }, obj.name),
          h('small', 'as '+ obj.character_name)
        )
      )
    )
  },
  quick_item: function(obj){
    let b_img = './static/img/bg_xs.png';
    return h('div.media.qs_item.cp',
      h('img.rounded.mr-2',{
        src: obj.small_cover_image || b_img,
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
        h('button.btn.btn-outline-success.btn-sm.mr-2.mb-2',{
          type: 'button',
          onclick: function(){
            ss.set('search_url', '&genre='+ encodeURIComponent(config.search.genre[i]));
            location.hash = 'search/'+ config.search.genre[i];
          }
        }, config.search.genre[i])
      )
    }
    return h('div.card.bg-dark.bd-dark',
      item
    );
  },
  yt_trailer: function(i){
    let item = h('iframe.tr-iframe',{
      frameBorder: 0,
      allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
      src: 'https://www.youtube.com/embed/'+ i
    })

    item.setAttribute('allowfullscreen', '');

    return item
  },
  sub_item: function(obj){
    return h('div.list-group-item',
      h('div.row',
        h('div.col-2', {title: 'rating'}, h('i.icon-star.mr-2.text-success'), obj.rating),
        h('div.col-2', {title: 'language'}, h('i.icon-language.mr-2.text-success'),obj.lang),
        h('div.col-6', {title: 'title'},h('p', obj.title)),
        h('div.col-2.text-right', h('a.icon-cloud-download-alt', {
          href: obj.link,
          title: 'download subtitle'
        }))
      )
    )
  }
}

module.exports = tpl;
