const config = require('../config'),
tpl = require('./tpl'),
h = require('./h'),
pagination = require('./pagination'),
{ls,ss} = require('./storage');

const rout = {
  home: function(dest){

    let list_recent = h('div.row',
      h('div.col-12.text-center',
        h('h2', 'Recent Uploads'),
        h('hr.w-100')
      )
    ),
    list_popular = h('div.row',
      h('div.col-12.text-center',
        h('h2', 'Popular Downloads'),
        h('hr.w-100')
      )
    );

    let home_cache = ls.get('home_cache');
    if(!home_cache ||
      typeof home_cache !== 'object' ||
       !home_cache.recent ||
       !home_cache.popular ||
       home_cache.date < Date.now()
    ){
      let obj = {
        date: Date.now() + config.settings.home_cache
      }
      utils.fetch(config.base_url + 'list_movies.json?limit=20&sort_by=date_added', function(err,res_rec){
        if(err){return ce(err)}
        obj.recent = res_rec.movies;
        for (let i = 0; i < res_rec.movies.length; i++) {
          list_recent.append(tpl.item_post(res_rec.movies[i]))
        }

        utils.fetch(config.base_url + 'list_movies.json?limit=20&sort_by=download_count', function(err,res_pop){
          if(err){return ce(err)}
          obj.popular = res_pop.movies;
          for (let i = 0; i < res_pop.movies.length; i++) {
            list_popular.append(tpl.item_post(res_pop.movies[i]))
          }

          ls.set('home_cache', obj)
          dest.append(
            list_popular,
            list_recent,
            tpl.cat_cloud()
          )
        })

      })
    } else {

      for (let i = 0; i < home_cache.recent.length; i++) {
        list_recent.append(tpl.item_post(home_cache.recent[i]))
      }
      for (let i = 0; i < home_cache.popular.length; i++) {
        list_popular.append(tpl.item_post(home_cache.popular[i]))
      }

      dest.append(
        list_popular,
        list_recent,
        tpl.cat_cloud()
      )

    }


  },
  recent: function(){
    ss.set('dest', 'search');
    ss.set('search_url', utils.build_search_url({sort_by:'date_added'}));
    location.hash = 'search/recent';
  },
  popular: function(){
    ss.set('dest', 'search');
    ss.set('search_url', utils.build_search_url({sort_by:'download_count'}));
    location.hash = 'search/popular'
  },
  search: function(dest){

    let title = location.hash.split('/').pop(),
    search_res = h('div.row',
      h('div.col-12.text-center',
        h('h2', utils.capitalize(title) + ' Search Results'),
        h('hr.w-100')
      )
    ),
    pag_view_main = h('div#pag_view_main.row'),
    search_url = ss.get('search_url'),
    pag_div = h('div#pagination.row');

    utils.fetch(config.base_url + 'list_movies.json?page=1' + search_url, function(err,res){
      if(err){return ce(err)}
      cl(res)
      for (let i = 0; i < res.movies.length; i++) {
        pag_view_main.append(tpl.item_post(res.movies[i]))
      }

      if(res.movie_count > res.limit){

        let max = Math.ceil(res.movie_count / res.limit),
        item;



        ss.set('pag-current', 1);
        ss.set('pag-max', max);

        if(max < 6){
          item = h('ul.pagination.col-md-6');
          for (let i = 0; i < max; i++) {
            item.append(pagination.pageItem(max,g.js(i + 1)))
          }
        } else {
          item = h('ul.pagination.col-md-6',
            pagination.prevlink(max),
            pagination.pag_back(max),
            pagination.pageItem(max,'2'),
            pagination.pageItem(max,'3'),
            pagination.pageItem(max,'4'),
            pagination.pag_forw(max),
            pagination.nextlink(max)
          )
        }

        pag_div.append(
          item,h('div.pag-text.col-md-6.text-right', 'viewing page ', h('span#pagnum', '1'), ' of '+ max)
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
    })


  },
  settings: function(main, cb){

  },
  browse: function(main, cb){
    let obj = {},
    sel_row = h('div.row'),
    sel;

    for (let key in config.search) {

      sel = h('select.form-control.custom-select.inp-dark', {
        onchange: function(evt){
          obj[key] = evt.target.value;
          cl(obj)
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
        h('div.col-md.col-sm-4',
          h('div.form-group',
            h('label', key.replace('_', ' ')),
            sel
          )
        )
      )
    }

    let base = h('div.row.justify-content-center',
      h('div.col-md-6.col-sm-12',
        h('div.input-group.mb-4',
          h('input.form-control.inp-dark.text-center',{
            placeholder: 'Search term...',
            onkeyup: function(evt){
              obj.query_term = encodeURIComponent(evt.target.value);
            }
          }),
          h('div.input-group-append',
            h('button.btn.btn-outline-success',{
              type: 'button',
              onclick: function(){
                ss.set('search_url', utils.build_search_url(obj));
                location.hash = 'search/advanced';
              }
            }, 'Search')
          )
        )
      )
    )

    main.append(base, sel_row)
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
    let id = ss.get('mov_id');
    if(!id || typeof parseInt(id) !== 'number'){
      return ce('invalid movie id')
    }

    let db_item = his_db.find({id: parseInt(id)}).value();

    if(!db_item){
      cl('not found')
      id = 'movie_details.json?movie_id='+ id +'&with_images=true&with_cast=true';
      utils.fetch(config.base_url + id, function(err,res){
        if(err){return ce(err)}
        res = res.movie;
        utils.fetch(config.base_url +'movie_suggestions.json?movie_id='+ res.id, function(err,sim){
          if(err){
            res.suggestions = ls.get('suggest') || [];
          } else {
            sim = sim.movies;
            let arr = [];
            for (let i = 0; i < sim.length; i++) {
              arr.push({
                medium_cover_image: sim[i].medium_cover_image,
                title_long: sim[i].title_long,
                id: sim[i].id
              })
              ls.set('suggest', arr);
              res.suggestions = arr
            }
          }

          dest.append(tpl.item_page(res))

          his_db.unshift(res).write();

          if(his_db.size().value() > config.settings.history_max){
            his_db.pop().write();
          }

        })
      })
    } else {

      dest.append(tpl.item_page(db_item))

      his_db.remove(db_item).write();
      his_db.unshift(db_item).write();

    }

  }
}

module.exports = rout;
