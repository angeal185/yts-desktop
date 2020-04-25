const LS = localStorage,
SS = sessionStorage,
CS = function(){};

const ls = {
  get: function(i){
    return jp(LS.getItem(i))
  },
  set: function(i,e){
    LS.setItem(i, js(e))
    return;
  },
  del: function(i){
    LS.removeItem(i);
  }
}

const ss = {
  get: function(i){
    return jp(SS.getItem(i))
  },
  set: function(i,e){
    SS.setItem(i, js(e))
    return;
  },
  del: function(i){
    SS.removeItem(i);
  }
}

CS.prototype = {
  set: function(key, val){
    this[key] = val;
  },
  get: function(key){
    return this[key];
  },
  del: function(key){
    delete this[key];
  }
};

const cs = new CS();

module.exports = { ls, ss, cs }
