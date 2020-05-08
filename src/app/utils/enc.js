const crypto = require('crypto'),
{ ls,ss } = require('./storage');

const enc = {
  rand: function(i) {
    return crypto.randomBytes(i);
  },
  hex_dec: function(i) {
    return Buffer.from(i, 'hex').toString('binary');
  },
  hex_enc: function(i) {
    return Buffer.from(i, 'binary').toString('hex');
  },
  rand_u8: function(len) {
    return window.crypto.getRandomValues(new Uint8Array(len));
  },
  hex2u8: function(hex) {
    return new Uint8Array(Buffer.from(hex, 'hex'))
  },
  u82hex: function(arr) {
    return Buffer.from(arr).toString('hex');
  },
  is_email: function(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return true;
    }
    return false;
  },
  is_letters: function(txt) {
    if (txt.match(/^[A-Za-z]+$/)) {
      return true;
    }
    return false;
  },
  is_alphanumeric: function(txt) {
    if (txt.match(/^[0-9a-zA-Z]+$/)) {
      return true;
    }
    return false;
  }
}

module.exports = enc;
