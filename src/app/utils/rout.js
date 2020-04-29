const config = require('../config'),
fs = require('fs'),
tpl = require('./tpl'),
h = require('./h'),
_ = require('lodash'),
pagination = require('./pagination'),
enc = require('./enc'),
urls = require('./urls'),
msgbox = require('./msgbox'),
{ls,ss} = require('./storage'),
Glide = require('./glide');

/*

let msg = {
  "name": "test 2",
  "topic": "test message 2",
  "msg": "test msg 2 created"
}


msgbox.send(msg ,function(err){
  if(err){return cl(err)}
  cl('msg sent');
})

*/

const rout = {
  home: function(dest){

    let recent_slide = h('div.glide__slides'),
    release_slide = recent_slide.cloneNode(),
    popular_slide = recent_slide.cloneNode(),
    list_recent = h('div.row',
      h('div.col-12.text-center',
        h('h2', 'Recent Uploads'),
        h('hr.w-100')
      ),
      h('div#recent_glide.glide',
        h('div.glide__track',{
            'data-glide-el': 'track'
          },
          recent_slide,
          tpl.glide_arrow()
        )
      )
    ),
    list_release = h('div.row',
      h('div.col-12.text-center',
        h('h2', 'Recent release'),
        h('hr.w-100')
      ),
      h('div#release_glide.glide',
        h('div.glide__track',{
            'data-glide-el': 'track'
          },
          release_slide,
          tpl.glide_arrow()
        )
      )
    ),
    list_popular = h('div.row',
      h('div.col-12.text-center',
        h('h2', 'Popular Movies'),
        h('hr.w-100')
      ),
      h('div#popular_glide.glide',
        h('div.glide__track',{
            'data-glide-el': 'track'
          },
          popular_slide,
          tpl.glide_arrow()
        )
      )
    );

    let res_rec = movie_db.orderBy('date_uploaded', 'desc').take(50).shuffle().take(12).value();
    res_pop = movie_db.orderBy('rating', 'desc').take(50).shuffle().take(12).value(),
    res_rel = movie_db.orderBy('year', 'desc').take(50).shuffle().take(12).value();

    for (let i = 0; i < res_rec.length; i++) {
      recent_slide.append(tpl.item_glide(res_rec[i]))
    }

    list_recent.append(tpl.show_all_btn('recent'))

    for (let i = 0; i < res_pop.length; i++) {
      popular_slide.append(tpl.item_glide(res_pop[i]))
    }

    list_popular.append(tpl.show_all_btn('popular'))

    for (let i = 0; i < res_rel.length; i++) {
      release_slide.append(tpl.item_glide(res_rel[i]))
    }

    list_release.append(tpl.show_all_btn('release'))


    dest.append(
      list_recent,
      tpl.actor_cloud(),
      list_popular,
      tpl.director_cloud(),
      list_release,
      tpl.cat_cloud()
    )

    _.forEach(['recent', 'release', 'popular'], function(i){
      new Glide('#'+ i +'_glide', config.glide).mount()
    })


  },
  contact: function(dest){

    tpl.contact(dest)


  },
  news: function(dest){

    ss.set('pag-current', 1)

    let news_db = jp(fs.readFileSync(base_dir + urls.news_db), 'utf8'),
    pag_view_main = h('div#pag_view_main.container'),
    pag_div = h('div#pagination.row'),
    search_res = h('div.container',
      h('div.row',
        h('div.col-md-6',
          h('h2', 'News',
            h('button.btn.btn-outline-success.float-right',{
              type: 'button',
              onclick: function(){
                window.dispatchEvent(new Event('hashchange'));
              }
            }, h('i.mr-2.icon-redo-alt'), 'Refresh')
          )
        ),
        h('div.col-md-6',
          h('div.form-group.mb-4',
            h('input.form-control.inp-dark',{
              placeholder: 'Search title...',
              onkeyup: utils.debounce(function(evt){
                let val = evt.target.value,
                news_res;
                utils.emptySync(pag_view_main);
                if(pag_div){
                  pag_div.remove()
                }
                if(val.length > 0){
                  news_res = _.filter(news_db, function(i){
                    if(i.title.toLowerCase().includes(val.toLowerCase())){
                      return i;
                    }
                  })

                  if(news_res && news_res.length > 0){
                    for (let i = 0; i < 20; i++) {
                      pag_view_main.append(tpl.news_post(news_res[i]),h('hr'))
                    }
                  } else {
                    pag_view_main.append(h('h5', 'No items found...'))
                  }
                }
              },1000)
            })
          )
        )
      ),
      h('hr.w-100')
    ),
    p_current = ss.get('pag-current')
    pag_num = h('span#pagnum', p_current),
    res = search_db.value();

    window.page_num = function(i){
      pag_num.innerText = i;
    }

    window.page_change = function(){
      let page_res = res[ss.get('pag-current') - 1]

      utils.emptySync(pag_view_main);

      for (let i = 0; i < page_res.length; i++) {
        pag_view_main.append(tpl.news_post(page_res[i]),h('hr'))
      }

      utils.totop(0)
    }

    for (let i = 0; i < res[p_current - 1].length; i++) {
      cd(res[p_current - 1][i])
      pag_view_main.append(tpl.news_post(res[p_current - 1][i]),h('hr'))
    }

    if(res.length > 1){

      let max = res.length,
      item;

      ss.set('pag-max', max);

      if(max < 6){
        item = h('ul.pagination.col-md-6');
        for (let i = 0; i < max; i++) {
          item.append(pagination.pageItem(js(i + 1)))
        }
        pag_div.append(
          item,
          h('div.pag-text.col-md-6.col-sm-12.text-right', 'viewing page ', pag_num, ' of '+ max),
        )
      } else {
        item = h('ul.pagination.col-md-6.col-sm-12.pl-3',
          pagination.firstlink(),
          pagination.prevlink(),
          pagination.pag_back(p_current),
          pagination.pageItem(p_current + 1),
          pagination.pageItem(p_current + 2),
          pagination.pageItem(p_current + 3),
          pagination.pag_forw(max,p_current),
          pagination.nextlink(max),
          pagination.lastlink(max)
        )

        pag_div.append(
          item,
          h('div.col-md-6.col-sm-12.mb-2',
            tpl.jump_to(max, pag_num, item)
          ),
          h('div.pag-text.col-md-6.col-sm-12', 'viewing page ', pag_num, ' of '+ max),
        )
      }





      dest.append(
        search_res,
        pag_view_main,
        h('div.container', pag_div)
      )

    } else {
      dest.append(
        search_res,
        pag_view_main
      )
    }

  },
  recent: function(){
    ss.set('dest', 'search');
    pag_db.set('search', movie_db.orderBy(['date_uploaded'], ['desc']).chunk(20).value()).write();
    ss.set('pag-current', 1)
    location.hash = 'search/recent';
  },
  release: function(){
    ss.set('dest', 'search');
    ss.set('pag-current', 1)
    pag_db.set('search', movie_db.orderBy(['year'], ['desc']).chunk(20).value()).write();
    location.hash = 'search/release';
  },
  popular: function(){
    ss.set('dest', 'search');
    pag_db.set(
      'search',
      movie_db.orderBy(['rating'], ['desc']).chunk(20).value()
    ).write();
    ss.set('pag-current', 1)
    location.hash = 'search/popular';
  },
  cast: function(dest){
    ss.set('cdw_search', 'cast');
    let s_db = jp(fs.readFileSync(base_dir + urls.staff_db, 'utf8')),
    c_div = h('div.card.bg-dark.bd-dark.mb-4',
      h('div.card-body.text-center')
    ),
    d_div = c_div.cloneNode(true),
    w_div = c_div.cloneNode(true),
    sel_item = h('span','Cast'),
    base = h('div.row.justify-content-center',
      h('div.col-md-6.col-sm-12.text-center',
        h('h4.text-success.mb-4', 'Search ', sel_item),
        h('div.form-group.mb-4',
          h('input.form-control.inp-dark.text-center',{
            placeholder: 'Search...',
            onkeyup: utils.debounce(function(evt){
              let val = evt.target.value;
              utils.emptySync(c_div.firstChild)
              if(val.length > 1){
                if(ss.get('cdw_search') === 'cast'){
                  for (let i = 0; i < s_db.actors.length; i++) {
                    if(s_db.actors[i].toLowerCase().includes(val.toLowerCase())){
                      c_div.firstChild.append(tpl.cast_btn(s_db.actors[i]))
                    }
                  }
                } else if(ss.get('cdw_search') === 'directors'){
                  for (let i = 0; i < s_db.directors.length; i++) {
                    if(s_db.directors[i].toLowerCase().includes(val.toLowerCase())){
                      c_div.firstChild.append(tpl.crew_btn(s_db.directors[i], 'director'))
                    }
                  }
                } else if(ss.get('cdw_search') === 'writters'){
                  for (let i = 0; i < s_db.writters.length; i++) {
                    if(s_db.writters[i].toLowerCase().includes(val.toLowerCase())){
                      c_div.firstChild.append(tpl.crew_btn(s_db.writters[i], 'writter'))
                    }
                  }
                }
              }
            }, 1000)
          })
        ),
        h('div.row',
          h('div.col-md-4',
            h('button.btn.btn-block.btn-outline-success.mt-2.mb-4.sh-95',{
              type: 'button',
              onclick: function(evt){
                utils.add_sp(this, 'Loading...', function(){
                  ss.set('cdw_search', 'cast');
                  sel_item.innerText = 'Cast';
                  utils.emptySync(c_div.firstChild);
                  utils.remove_sp(evt.target, 'Cast');
                })

              }
            }, h('span', 'Cast'))
          ),
          h('div.col-md-4',
            h('button.btn.btn-block.btn-outline-success.mt-2.mb-4.sh-95',{
              type: 'button',
              onclick: function(evt){
                utils.add_sp(this, 'Loading...', function(){
                  ss.set('cdw_search', 'directors');
                  sel_item.innerText = 'Directors';
                  utils.emptySync(c_div.firstChild);
                  utils.remove_sp(evt.target, 'Directors');
                })
              }
            }, 'Directors')
          ),
          h('div.col-md-4',
            h('button.btn.btn-block.btn-outline-success.mt-2.mb-4.sh-95',{
              type: 'button',
              onclick: function(evt){
                utils.add_sp(this, 'Loading...', function(){
                  ss.set('cdw_search', 'writters');
                  sel_item.innerText = 'Writters';
                  utils.emptySync(c_div.firstChild);
                  utils.remove_sp(evt.target, 'Writters');
                })
              }
            }, 'Writters')
          )
        )
      ),
      h('div.col-12',
        c_div
      )
    )

    dest.append(base);
  },
  search: function(dest){

    let title = location.hash.split('/').pop(),
    search_res = h('div.row',
      h('div.col-12.text-center',
        h('h2', utils.capitalize(decodeURIComponent(title)) + ' Search Results'),
        h('hr.w-100')
      )
    ),
    pag_view_main = h('div#pag_view_main.row'),
    pag_div = h('div#pagination.row'),
    p_current = ss.get('pag-current')
    pag_num = h('span#pagnum', p_current),
    res = search_db.value();

    window.page_num = function(i){
      pag_num.innerText = i;
    }

    window.page_change = function(){
      let page_res = res[ss.get('pag-current') - 1]

      utils.emptySync(pag_view_main);

      for (let i = 0; i < page_res.length; i++) {
        pag_view_main.append(tpl.item_post(page_res[i]))
      }

      utils.totop(0)
    }

    for (let i = 0; i < res[p_current - 1].length; i++) {
      pag_view_main.append(tpl.item_post(res[p_current - 1][i]))
    }

    if(res.length > 1){

      let max = res.length,
      item;

      ss.set('pag-max', max);

      if(max < 6){
        item = h('ul.pagination.col-md-6');
        for (let i = 0; i < max; i++) {
          item.append(pagination.pageItem(js(i + 1)))
        }
      } else {
        item = h('ul.pagination.col-md-6.col-sm-12.pl-3',
          pagination.firstlink(),
          pagination.prevlink(),
          pagination.pag_back(p_current),
          pagination.pageItem(p_current + 1),
          pagination.pageItem(p_current + 2),
          pagination.pageItem(p_current + 3),
          pagination.pag_forw(max,p_current),
          pagination.nextlink(max),
          pagination.lastlink(max)
        )
      }

      pag_div.append(
        item,
        h('div.col-md-6.col-sm-12.mb-2',
          tpl.jump_to(max, pag_num, item)
        ),
        h('div.pag-text.col-md-6.col-sm-12', 'viewing page ', pag_num, ' of '+ max),
      )

      dest.append(
        search_res,
        pag_view_main,
        h('div.container', pag_div)
      )

    } else {
      dest.append(
        search_res,
        pag_view_main
      )
    }

  },
  settings: function(main, cb){

    let ic_toggle = h('input.form-control.inp-dark.mb-2',{
      readOnly: true,
      value: config.settings.img_cache
    }),
    is_toggle = h('input.form-control.inp-dark.mb-2',{
     readOnly: true,
     value: config.settings.subs_cache
   })


    let base_div = h('div.row',
      h('h3.col-12.mb-2', 'Base settings'),
      h('div.col.md-6',
        h('div.form-group',
          h('label', 'site url'),
          h('input.form-control.inp-dark',{
            value: config.yts_url,
            onkeyup: utils.debounce(function(){
              let val = this.value;
              if(val.length > 0){
                config.yts_url = val;
                utils.update_settings(config);
              }
            },2000)
          })
        )
      ),
      h('div.col.md-6',
        h('div.form-group',
          h('label', 'subtitles url'),
          h('input.form-control.inp-dark',{
            value: config.sub_url,
            onkeyup: utils.debounce(function(){
              let val = this.value;
              if(val.length > 0){
                config.sub_url = val;
                utils.update_settings(config);
              }
            },2000)
          })
        )
      ),
      h('div.col-12', h('hr')),
      h('h3.col-12.mb-2', 'Cache settings'),
      h('div.col-md-6',
        h('div.form-group',
          h('label', 'image cache size'),
          h('input.form-control.inp-dark.mb-2',{
            readOnly: true,
            value: function(){
              return utils.formatBytes(fs.statSync(base_dir + '/app/cache/img').size)
            }
          }),
          h('label', 'image cache count'),
          h('input.form-control.inp-dark.mb-2',{
            readOnly: true,
            value: img_cache.value().length
          }),
          h('label.w-100.cp', 'image cache enabled',
            h('span.float-right.text-success', {
              onclick: function(evt){
                if(config.settings.img_cache){
                  config.settings.img_cache = false;
                  ic_toggle.value = false
                } else {
                  config.settings.img_cache = true;
                  ic_toggle.value = true
                }
                utils.update_settings(config);
              }
            },'toggle')
          ),
          ic_toggle
        )
      ),
      h('div.col-md-6',
        h('div.form-group',
          h('label', 'subtitles cache size'),
          h('input.form-control.inp-dark.mb-2',{
            readOnly: true,
            value: function(){
              return utils.formatBytes(fs.statSync([base_dir, urls.subs].join('/')).size)
            }
          }),
          h('label', 'subtitles cache count'),
          h('input.form-control.inp-dark.mb-2',{
            readOnly: true,
            value: subs_cache.value().length
          }),
          h('label.w-100.cp', 'subtitles cache enabled',
            h('span.float-right.text-success', {
              onclick: function(evt){
                if(config.settings.subs_cache){
                  config.settings.subs_cache = false;
                  is_toggle.value = false
                } else {
                  config.settings.subs_cache = true;
                  is_toggle.value = true
                }
                utils.update_settings(config);
              }
            },'toggle')
          ),
          is_toggle
        )
      )

    )

    main.append(base_div);
  },
  browse: function(main, cb){
    let obj = {order_by: 'desc', limit: 20, sort_by: 'rating'},
    sel_row = h('div.row.mb-4'),
    base = h('div.row.justify-content-center',
      h('div.col-md-6.col-sm-12.text-center',
        h('h4.text-success.mb-4', 'Advanced Search'),
        h('div.input-group.mb-4',
          h('input.form-control.inp-dark.text-center',{
            placeholder: 'Search term...',
            onkeyup: function(evt){
              obj.query_term = evt.target.value;
            }
          }),
          h('div.input-group-append',
            h('button.btn.btn-outline-success',{
              type: 'button',
              onclick: function(){

                if(typeof obj.limit === 'string'){
                  obj.limit = parseInt(obj.limit);
                }

                let sdb = movie_db.value();

                if(obj.query_term && obj.query_term !== ''){
                  sdb = sdb.filter(function(x){
                     return x.title.toLowerCase().includes(obj.query_term.toLowerCase())
                  });
                }

                if(obj.minimum_rating && obj.minimum_rating !== 'All'){
                  sdb = sdb.filter(function(x){
                     return x.rating >= parseInt(obj.minimum_rating)
                  });
                }

                if(obj.genre && obj.genre !== 'All'){
                  sdb = sdb.filter(function(o){
                    let item = o.genres;
                    if(item.indexOf(obj.genre) !== -1){
                      return o;
                    }
                  })
                }

                if(obj.quality && obj.quality !== 'All'){
                  sdb = sdb.filter(function(o){
                    let item = o.genres;
                    for (let i = 0; i < o.torrents.length; i++) {
                      if(o.torrents[i].quality === obj.quality){
                        return o;
                      }
                    }
                  })
                }

                if(obj.sort_by === 'published'){
                  sdb = sdb.filter(function(o){
                    if(typeof o.published === 'string' && o.published !== 'N/A'){
                      return o;
                    }
                  })
                }

                sdb = _.chunk(_.orderBy(sdb, [obj.sort_by], [obj.order_by]), obj.limit);

                pag_db.set('search',sdb).write();
                ss.set('pag-current', 1);
                location.hash = 'search/advanced';
              }
            }, 'Search')
          )
        )
      )
    ),
    sel;

    for (let key in config.search) {

      sel = h('select.form-control.custom-select.inp-dark', {
        size: 8,
        onchange: function(evt){
          obj[key] = evt.target.value;
          cd(obj)
        }
      });
      for (let i = 0; i < config.search[key].length; i++) {
        sel.append(
          h('option',{
            value: config.search[key][i]
          }, config.search[key][i].replace('_', ' '))
        )
      }

      sel_row.append(
        h('div.col-md-4.col-sm-4',
          h('div.form-group.mb-4',
            h('label', key.replace('_', ' ')),
            sel
          )
        )
      )
    }

    sel_row.append(h('div.col-12',
      h('hr')
    ))

    main.append(base, sel_row, tpl.cat_cloud())
  },
  history: function(main, cb){

    let base_res = h('div.row',
      h('div.col-12.text-center',
        h('h2', 'History'),
        h('hr.w-100')
      )
    ),
    items = his_db.value();

    for (let i = 0; i < items.length; i++) {
      base_res.append(tpl.item_sel(items[i], 'history'))
    }

    main.append(
      base_res,
      tpl.cat_cloud()
    )

  },
  saved: function(main, cb){
    let base_res = h('div.row',
      h('div.col-12.text-center',
        h('h2', 'Saved items'),
        h('hr.w-100')
      )
    ),
    items = save_db.value();

    for (let i = 0; i < items.length; i++) {
      base_res.append(tpl.item_sel(items[i], 'saved'))
    }

    main.append(
      base_res,
      tpl.cat_cloud()
    )
  },
  movie: function(dest){
    let id = parseInt(ss.get('mov_id'));
    if(!id || typeof id !== 'number'){
      return ce('invalid movie id')
    }

    let res = movie_db.find({id: id}).value()
    dest.append(tpl.item_page(res))

    his_db.remove({id: id}).write()
    his_db.unshift(res).write();
    if(his_db.size().value() > config.settings.history_max){
      his_db.pop().write();
    }

  }
}

module.exports = rout;
