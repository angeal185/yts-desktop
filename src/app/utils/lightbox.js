const h = require('./h');

const lightbox = {
  init: function(arr){
    arr = arr.slice(0, 3);

    let lb_content = document.getElementById('lb-main'),
    lb_row = h('div.row'),
    b_img = './static/img/bg_xl.png',
    b_img_2 = './static/img/bg_sm.png';

    while (lb_content.firstChild) {
      lb_content.removeChild(lb_content.firstChild);
    }

    for (let i = 1; i < (arr.length+1); i++) {
      lb_content.append(
        h('div.mySlides',
          h('div.numbertext', i +' / '+ arr.length),
          h('img.img-fluid',{
            src: arr[i-1] || b_img,
            onerror: function(evt){
              evt.target.src = b_img
            }
          })
        )
      )
      lb_row.append(
        h('div.col-4',
          h('img.lb-demo.img-fluid.mt-4.mb-4.cp.sh-95',{
            src: arr[i-1] || b_img_2,
            onclick: function(){
              lightbox.currentSlide(i);
            },
            onerror: function(evt){
              evt.target.src = b_img_2
            }
          })
        )
      )
    }

    lb_content.append(
      h('a.lb-prev.icon-chevron-left', {
        onclick: function(){
          lightbox.plusSlides(-1);
        }
      }),
      h('a.lb-next.icon-chevron-right', {
        onclick: function(){
          lightbox.plusSlides(1);
        }
      }),
      lb_row
    )

  },
  open:function() {
    document.getElementById("myModal").classList.remove('hidden');
  },
  close: function() {
    document.getElementById("myModal").classList.add('hidden');
  },
  plusSlides: function(n) {
    lightbox.show(slideIndex += n);
  },
  currentSlide: function(n) {
    lightbox.show(slideIndex = n);
  },
  show: function(n) {
    let i;
    slides = document.getElementsByClassName("mySlides"),
    dots = document.getElementsByClassName("lb-demo");

    if (n > slides.length) {
      slideIndex = 1;
    }
    if (n < 1) {
      slideIndex = slides.length;
    }
    for (i = 0; i < slides.length; i++) {
      slides[i].classList.add('hidden');
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].classList.remove('active')
    }
    slides[slideIndex-1].classList.remove('hidden');
    dots[slideIndex-1].classList.add('active');
  }
}

module.exports = lightbox
