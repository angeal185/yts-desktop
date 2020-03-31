
const h = require('./h'),
//utils = require('./index'),
tpl = require('./tpl'),
{ls,ss} = require('./storage');

const pagination = {
  set_active: function(item, max){

    let items = document.getElementsByClassName('pag-num');
    for (let i = 0; i < items.length; i++) {
      items[i].parentNode.classList.remove('active')
    }

    item.parentNode.classList.add('active');
    document.getElementById('pagnum').innerText = item.innerText;

  },
  pag_back: function(max){
    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(){
          if(ss.get('pag-current') === 1){
            return;
          }

          let items = document.getElementsByClassName('pag-num');

          if(ss.get('pag-current') !== 2 && parseInt(items[0].innerText) !== 1){
            for (let i = 0; i < items.length; i++) {
              items[i].innerText = parseInt(items[i].innerText) - 1;
            }
            pagination.set_active(items[1])
            items = parseInt(items[1].innerText);
          } else {
            pagination.set_active(items[0])
            items = parseInt(items[0].innerText);
          }

          ss.set('pag-current', items);

          pagination.page_select(items)

        }
      },'1')
    )
    return item;
  },
  pageItem: function(max, i){

    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(){
          let items = parseInt(this.innerText);
          if(ss.get('pag-current') === items){
            return;
          }

          ss.set('pag-current', items)
          pagination.page_select(items)
          pagination.set_active(this)

        }
      },i)
    )
    return item;
  },
  pag_forw: function(max){
    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(){
          let items = document.getElementsByClassName('pag-num');
          if(ss.get('pag-current') === max){
            return;
          }

          if(ss.get('pag-current') !== (max - 1) && parseInt(items[4].innerText) !== max){
            for (let i = 0; i < items.length; i++) {
              items[i].innerText = parseInt(items[i].innerText) + 1;
            }
            pagination.set_active(items[3])
            items = parseInt(items[3].innerText);
          } else {
            pagination.set_active(items[4])
            items = parseInt(items[4].innerText);
          }

          ss.set('pag-current', items);
          pagination.page_select(items)


        }
      },'5')
    )

    return item;
  },
  prevlink: function(max){
    let item = h('li.page-item',
      h('a.page-link', {
        onclick: function(){
          let items = document.getElementsByClassName('pag-num');
          if(ss.get('pag-current') === 1 || parseInt(items[0].innerText) < 5){
            return;
          }

          for (let i = 0; i < items.length; i++) {
            items[i].innerText = parseInt(items[i].innerText) - 5;
          }

          pagination.set_active(items[4])
          items = parseInt(items[4].innerText);
          ss.set('pag-current', items);
          pagination.page_select(items)

        }
      },'Prev')
    )

    return item;
  },
  nextlink: function(max){
    let item = h('li.page-item',
      h('a.page-link', {
        onclick: function(){
          let items = document.getElementsByClassName('pag-num');
          if(ss.get('pag-current') === max  || parseInt(items[4].innerText) > (max - 5)){
            return;
          }

          for (let i = 0; i < items.length; i++) {
            items[i].innerText = parseInt(items[i].innerText) + 5;
          }

          pagination.set_active(items[0])
          items = parseInt(items[0].innerText)
          ss.set('pag-current', items)
          pagination.page_select(items)

        }
      },'Next')
    );

    return item;
  },
  page_select: function(evt){

    let pag_view_main = document.getElementById('pag_view_main'),
    search_url = ss.get('search_url');

    utils.emptySync(pag_view_main);

    utils.fetch(config.base_url + 'list_movies.json?page=' + evt + search_url, function(err,res){
      if(err){return ce(err)}
      cl(res)
      for (let i = 0; i < res.movies.length; i++) {
        pag_view_main.append(tpl.item_post(res.movies[i]))
      }
    })
  }
}

module.exports = pagination;
