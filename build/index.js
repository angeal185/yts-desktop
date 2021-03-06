const fs = require('fs'),
crypto = require('crypto'),
_ = require('lodash'),
glob = require('glob'),
path = require('path'),
gzip = require('../src/app/utils/gzip'),
db_status = require('../../yts-db/db-status'),
s_db = require('../src/app/db/staff_db');


let db_url = process.cwd().split('/').slice(0,-1);
db_url.push('yts-db');
db_url = db_url.join('/');


const build = {
  scrap_reviews: function(start, end){
    global.err_arr = [];
    glob(db_url + '/reviews/*.json', function(err,res){
      if(err){return cl('globbb errr')}
      let arr = [];

      for (let i = 0; i < res.length; i++) {
        arr.push(path.basename(res[i], '.json'))
      }

      let x = movie_db.value();

        let cnt = start;
        init()
        function init(){
          if(arr.indexOf(x[cnt].imdb_code) === -1){
            build.fetch_reviews(x[cnt].imdb_code, function(err,res){
              if(!err && typeof res === 'object'){
                fs.writeFileSync([db_url, 'reviews', x[cnt].imdb_code + '.json'].join('/'), js(res))
                cl(cnt + ' out of '+ end +' complete')
              } else {
                err_arr.push(x[cnt].imdb_code)
              }
              cnt++
              if(cnt === end){
                  cl(js(err_arr))
                cl('done')
              } else {
                init()
              }
              return;
            })
          } else {
            cnt++
            if(cnt === end){
              cl(js(err_arr))
              cl('done')
            } else {
              init()
            }
          }
        }


    })
  },
  fetch_reviews: function(id, cb){
    fetch('https://www.imdb.com/title/'+ id +'/reviews', {
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
    .then(function(res) {

      let items = new DOMParser(),
      arr = [];
      items = items.parseFromString(res, "text/html");
      items = items.getElementsByClassName('lister-item-content');
      let rank;

      if(items){
        for (let i = 0; i < items.length; i++) {
          if(i < 3){
            rank = items[i].getElementsByClassName('actions')[0].innerText.trim().split(' ');
            arr.push({
              title: items[i].getElementsByClassName('title')[0].innerText.trim(),
              rating: parseFloat(items[i].getElementsByTagName('span')[1].innerText.trim()),
              date: items[i].getElementsByClassName('review-date')[0].innerText.trim(),
              review: items[i].getElementsByClassName('text show-more__control')[0].innerHTML,
              user: items[i].getElementsByClassName('display-name-link')[0].firstChild.innerText.trim(),
              rank: [parseInt(rank[0]), parseInt(rank[3])]
            })
          }
        }
      }


      cb(false, arr)
    })
    .catch(function(err){
      cb(err)
    })
  },
  gz_db: function(src, dest){
    gzip.zip(src,dest, function(err){
      if(err){return cl('unable to gz ' + src)}
      cl(dest +' gz success')
    })
  },
  get_recent: function(page){

    let arr = [];

    fetch('https://yts.mx/api/v2/list_movies.json?limit=50&sort_by=date_added&page='+ page, {
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
        data = data.data.movies;
      }

      let cnt = 0;
      for (let i = 0; i < data.length; i++) {
        arr.unshift(data[i].id);
        if(movie_db.find({id: data[i].id}).value()) {
          cnt++
        }
      }

      if(cnt === data.length){
        cl('no new entries')
      } else {
        cl(js(arr))
        cl('page '+ page + ' complete')
      }

    })
    .catch(function(err){
      cb(err)
    })

  },
  update_db: function(id){

    fetch('https://yts.mx/api/v2/movie_details.json?with_images=false&with_cast=true&movie_id='+ id, {
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
      if(data.status === 'ok'){
        data = data.data.movie;
      }

      let torrents = data.torrents,
      cast = data.cast || [],
      img = data.background_image.split('/');
      img = img.slice(0,-1).pop();

      for (let i = 0; i < torrents.length; i++) {
        delete torrents[i].url;
        delete torrents[i].seeds;
        delete torrents[i].peers;
        delete torrents[i].size_bytes;
        delete torrents[i].date_uploaded;
        delete torrents[i].date_uploaded_unix;
      }

      for (let i = 0; i < cast.length; i++) {
        if(cast[i].url_small_image){
          cast[i].url_small_image = cast[i].url_small_image.split('/').pop();
        }
      }

      let x = {
        id: id,
        url: data.url.replace('https://yts.mx/movie/', ''),
        imdb_code: data.imdb_code,
        title: data.title_english,
        year: data.year,
        rating: data.rating,
        runtime: data.runtime,
        genres: data.genres,
        synopsis: data.description_full,
        yt_trailer_code: data.yt_trailer_code,
        language: data.language || null,
        mpa_rating: data.mpa_rating || "N/A",
        torrents: torrents,
        date_uploaded: data.date_uploaded_unix * 1000,
        cast: cast,
        director: null,
        writter: null,
        published: null,
        votes: null,
        suggest: [],
        img: img,
        metascore: "N/A",
        gross: "N/A"
      }

      fetch('https://yts.mx/api/v2/movie_suggestions.json?movie_id='+ id, {
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
      .then(function(sdata) {
        if(sdata.status === 'ok'){
          sdata = sdata.data.movies;
        }

        let items = [];
        for (let i = 0; i < sdata.length; i++) {
          items.push(sdata[i].id)
        }

        x.suggest = items

        utils.imdb_spec(x.imdb_code, function(err, obj){
          if(err){return cl(err)}
          x.rating = obj.rating;
          x.votes = obj.votes;
          x.director = obj.director;
          x.writter = obj.writter;
          x.gross = obj.gross;
          x.metascore = obj.metascore;
          x.published = obj.published;

          if(!x.mpa_rating || x.mpa_rating === 'N/A'){
            x.mpa_rating = obj.mpa_rating
          }

          if(typeof x !== 'object'){
            throw 'type error'
          }

          if(movie_db.find({id: x.id}).value()) {
            movie_db.find({id: x.id}).assign(x).write()
          } else {
            movie_db.unshift(x).write()
          }


          window.cnt++
          cl('item '+ window.cnt + ' done!')
          window.getdat()

        })

      })
      .catch(function(err){
        cl(err)
      })

    })
    .catch(function(err){
      cl(err)
    })

  },
  sync_db: function(){

    let newDat = jp(fs.readFileSync('./build/new.json', 'utf8')).movies,
    x = movie_db.value(),
    y = his_db.value(),
    z = save_db.value(),
    actors = [],
    directors = [],
    writters = [];

    for (let i = 0; i < newDat.length; i++) {

      for (let j = 0; j < newDat[i].cast.length; j++) {
        if(actors.indexOf(newDat[i].cast[j].name) === -1){
          actors.push(newDat[i].cast[j].name)
        }
      }

      if(directors.indexOf(newDat[i].director) === -1){
        directors.push(newDat[i].director)
      }

      if(writters.indexOf(newDat[i].writter) === -1){
        writters.push(newDat[i].writter)
      }

      if(_.find(x, {imdb_code: newDat[i].imdb_code})) {
        _.assign(_.find(x, {imdb_code: newDat[i].imdb_code}), newDat[i]);
        if(_.find(y, {imdb_code: newDat[i].imdb_code})) {
          _.assign(_.find(y, {imdb_code: newDat[i].imdb_code}), newDat[i]);
        }
        if(_.find(z, {imdb_code: newDat[i].imdb_code})) {
          _.assign(_.find(z, {imdb_code: newDat[i].imdb_code}), newDat[i]);
        }
      } else {
        x.unshift(newDat[i]);
      }
    }

    for (let i = 0; i < actors.length; i++) {
      if(s_db.actors.indexOf(actors[i]) === -1){
        s_db.actors.push(actors[i])
      }
    }

    for (let i = 0; i < directors.length; i++) {
      if(s_db.directors.indexOf(directors[i]) === -1){
        s_db.directors.push(directors[i])
      }
    }

    for (let i = 0; i < writters.length; i++) {
      if(s_db.writters.indexOf(writters[i]) === -1){
        s_db.writters.push(writters[i])
      }
    }


    db_status.yts_db = {
      hash: crypto.createHash('sha512').update(js(x)).digest('hex'),
      date: Date.now()
    }

    db_status.staff_db = {
      hash: crypto.createHash('sha512').update(js(s_db)).digest('hex'),
      date: Date.now()
    }

    fs.writeFileSync('./src/app/db/status_db.json', js(db_status), function(err){
      if(err){return cl('status_db update err')}

      fs.writeFileSync('../yts-db/db-status', js(db_status,0,2), function(err){
        if(err){return cl('db-status update err')}

        fs.writeFileSync('./src/app/db/staff_db.json', js(s_db), function(err){
          if(err){return cl('staff db app write err')}

            fs.writeFileSync('./src/app/db/yts_db.json', js({movies: x}), function(err){
              if(err){return cl('staff db gzip err')}

              gzip.zip('./src/app/db/staff_db.json', '../yts-db/db/staff_db.json', function(err){
                if(err){return cl('staff db gzip err')}

                gzip.zip('./src/app/db/yts_db.json', '../yts-db/db/yts_db.json', function(err){
                  if(err){return cl('movie db gzip err')}

                  db.set('history', y).write();
                  db.set('saved', z).write();
                  cl('database sync complete, reloading...');

                  setTimeout(function(){
                    location.reload();
                  },5000);

                })
              })
            })

        })
      })
    })

  }
}

//build.gz_db(base_dir + '/app/db/staff_db.json', db_url + '/db/staff_db.json.gz');
/*
window.getdat = function(){
  window.cnt = 298;
  let items = [];

  if(window.cnt >= 298){
    return cl('done')
  }

  build.update_db(items[window.cnt])
}

//window.getdat()
*/

//build.sync_db()
cl( movie_db.value()[0])
//build.scrap_reviews(6000,7000)


module.exports = build;
