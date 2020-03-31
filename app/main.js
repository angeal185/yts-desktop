require('./utils/global');

const config = require('./config'),
utils = require('./utils');

utils.pre(function(err){
  if(err){return ce('unable to init pre functions.')}
  utils.init();
  document.scripts[0].remove();
});
