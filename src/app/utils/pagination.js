const h = require('./h'),
{ls,ss} = require('./storage');

const pagination = {
  set_active: function(item, items){
    for (let i = 0; i < items.length; i++) {
      items[i].parentNode.classList.remove('active')
    }

    item.parentNode.classList.add('active');

    window.page_num(item.innerText);

  },
  pag_back: function(p_current){
    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(evt){
          if(ss.get('pag-current') === 1){
            return;
          }

          let dest = evt.target.parentNode.parentNode,
          items = dest.getElementsByClassName('pag-num');

          if(ss.get('pag-current') !== 2 && parseInt(items[0].innerText) !== 1){
            for (let i = 0; i < items.length; i++) {
              items[i].innerText = parseInt(items[i].innerText) - 1;
            }
            pagination.set_active(items[1], items)
            items = parseInt(items[1].innerText);
          } else {
            pagination.set_active(items[0], items)
            items = parseInt(items[0].innerText);
          }

          ss.set('pag-current', items);

          window.page_change();

        }
      }, p_current)
    )
    return item;
  },
  pageItem: function(i){

    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(){

          let dest = this.parentNode.parentNode,
          items = dest.getElementsByClassName('pag-num'),
          item = parseInt(this.innerText);

          if(ss.get('pag-current') === item){
            return;
          }

          ss.set('pag-current', item)
          window.page_change();
          pagination.set_active(this, items)

        }
      },i)
    )
    return item;
  },
  pag_forw: function(max, p_current){
    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(evt){

          if(ss.get('pag-current') === max){
            return;
          }

          let dest = evt.target.parentNode.parentNode,
          items = dest.getElementsByClassName('pag-num');

          if(ss.get('pag-current') !== (max - 1) && parseInt(items[4].innerText) !== max){
            for (let i = 0; i < items.length; i++) {
              items[i].innerText = parseInt(items[i].innerText) + 1;
            }
            pagination.set_active(items[3], items)
            items = parseInt(items[3].innerText);
          } else {
            pagination.set_active(items[4], items)
            items = parseInt(items[4].innerText);
          }

          ss.set('pag-current', items);
          window.page_change();

        }
      },p_current + 4)
    )

    return item;
  },
  prevlink: function(){
    let item = h('li.page-item',
      h('a.page-link', {
        onclick: function(evt){

          let dest = evt.target.parentNode.parentNode,
          items = dest.getElementsByClassName('pag-num');

          if(ss.get('pag-current') === 1 || parseInt(items[0].innerText) < 5){
            return;
          }

          for (let i = 0; i < items.length; i++) {
            items[i].innerText = parseInt(items[i].innerText) - 5;
          }

          pagination.set_active(items[4], items)
          items = parseInt(items[4].innerText);
          ss.set('pag-current', items);
          window.page_change();

        }
      },'Prev')
    )

    return item;
  },
  nextlink: function(max){
    let item = h('li.page-item',
      h('a.page-link', {
        onclick: function(evt){

          let dest = evt.target.parentNode.parentNode,
          items = dest.getElementsByClassName('pag-num');

          if(ss.get('pag-current') === max  || parseInt(items[4].innerText) > (max - 5)){
            return;
          }

          for (let i = 0; i < items.length; i++) {
            items[i].innerText = parseInt(items[i].innerText) + 5;
          }

          pagination.set_active(items[0], items)
          items = parseInt(items[0].innerText)
          ss.set('pag-current', items)
          window.page_change();

        }
      },'Next')
    );

    return item;
  }
}

module.exports = pagination;
