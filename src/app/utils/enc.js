const crypto = require('crypto'),
{ ls,ss } = require('./storage');

const enc = {
  defaults: {
    cipher: 'aes',
    bit_len: '256',
    iv_len: 32,
    tag_len: 16,
    encode: 'hex',
    digest: 'SHA-512',
    scrypt: {
      N: 16384,
      r: 8,
      p:1
    },
    ec: {
      curve: 'P-521'
    }
  },
  rand: function(i) {
    return crypto.randomBytes(i);
  },
  keygen: function(len) {
    return enc.rand(len).toString(enc.defaults.encode)
  },
  hex_dec: function(i) {
    return Buffer.from(i, 'hex').toString('binary');
  },
  hex_enc: function(i) {
    return Buffer.from(i, 'binary').toString('hex');
  },
  hash512: function(data) {
    return crypto.createHash('sha512').update(data).digest('hex')
  },
  gen_fp: function(data){
    let hash = crypto.createHash('sha1').update(data).digest('hex');
    return hash.split(/(?=(?:..)*$)/).join(':').toUpperCase();
  },
  hmac: function(secret, data) {
    try {
      const sig = crypto.createHmac('sha512', secret);
      sig.update(data);
      return sig.digest('hex');
    } catch (err) {
      throw new ERROR('hmac tamper');
    }
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
  ecdh_g: function(){
    wc.generateKey({name: "ECDH", namedCurve: enc.defaults.ec.curve},true,["deriveBits"])
    .then(function(key){

      wc.exportKey("jwk",key.publicKey)
      .then(function(key_public){
        let obj = {
          public: Buffer.from(js(key_public), 'binary').toString('hex')
        }
          cl()
          wc.exportKey("jwk",key.privateKey)
          .then(function(key_private){
            obj.private = Buffer.from(js(key_private), 'binary').toString('hex')
            cl(js(obj))
          })
          .catch(function(err){
             cl(err);
          });
      })
      .catch(function(err){
         cl(err);
      });
    })
    .catch(function(err){
       cl(err);
    });
  },
  ecdh_gen: function(cb){
    wc.generateKey({name: "ECDH", namedCurve: enc.defaults.ec.curve},true,["deriveBits"])
    .then(function(key){

      wc.exportKey("jwk",key.publicKey)
      .then(function(key_public){
          db.set('crypto.ecdh_public',
            Buffer.from(js(key_public), 'binary').toString('hex')
          ).write();
          wc.exportKey("jwk",key.privateKey)
          .then(function(key_private){
            db.set('crypto.ecdh_private',
              Buffer.from(js(key_private), 'binary').toString('hex')
            ).write();
            cb(false, 'ecdh keygen complete')
          })
          .catch(function(err){
             cl(err);
          });
      })
      .catch(function(err){
         cl(err);
      });
    })
    .catch(function(err){
       cl(err);
    });
  },
  ecdsa_gen: function(cb){
    wc.generateKey({name: "ECDSA", namedCurve: enc.defaults.ec.curve},true,["sign", "verify"])
    .then(function(key){
      wc.exportKey("jwk",key.publicKey)
      .then(function(key_public){
          db.set('crypto.ecdsa_public',
            Buffer.from(js(key_public), 'binary').toString('hex')
          ).write();
          wc.exportKey("jwk",key.privateKey)
          .then(function(key_private){
            db.set('crypto.ecdsa_private',
              Buffer.from(js(key_private), 'binary').toString('hex')
            ).write();
            cb(false, 'ecdh keygen complete')
          })
          .catch(function(err){
             cl(err);
          });
      })
      .catch(function(err){
         cl(err);
      });
    })
    .catch(function(err){
       cl(err);
    });
  },
  ecdsa_sign: function(private, data, cb){

    private = jp(Buffer.from(private, 'hex').toString('binary'));
    data = new Uint8Array(Buffer.from(data, 'hex'));
    wc.importKey("jwk",private,{name: "ECDSA",namedCurve: enc.defaults.ec.curve}, true,["sign"])
    .then(function(privateKey){
      wc.sign({name: "ECDSA",hash: {name: enc.defaults.digest}},privateKey,data)
      .then(function(sig){
          cb(false, Buffer.from(sig).toString('hex'));
      })
      .catch(function(err){
          cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });

  },
  ecdsa_verify: function(){
    public = jp(Buffer.from(public, 'hex').toString('binary'));
    wc.importKey("jwk",private,{name: "ECDSA",namedCurve: enc.defaults.ec.curve}, true,["deriveBits"])
    .then(function(privateKey){

    })
    .catch(function(err){
      cb(err);
    });
  },
  ecdh_derive: function(public, private, cb){

    public = jp(Buffer.from(public, 'hex').toString('binary'));
    private = jp(Buffer.from(private, 'hex').toString('binary'));
    wc.importKey("jwk",private,{name: "ECDH",namedCurve: enc.defaults.ec.curve}, true,["deriveBits"])
    .then(function(privateKey){
        wc.importKey("jwk",public,{name: "ECDH",namedCurve: enc.defaults.ec.curve}, true,[])
        .then(function(publicKey){
            wc.deriveBits({name: "ECDH",namedCurve: enc.defaults.ec.curve,public: publicKey},privateKey,513)
            .then(function(bits){
              let secret = Buffer.from(bits, 1, 32),
              salt = Buffer.from(bits, 33, 32);
              crypto.scrypt(secret, salt, 32, enc.defaults.scrypt, function(err, derivedKey){
                if(err){return cb(err)};
                cb(false, derivedKey.toString('hex'));
              });
            })
            .catch(function(err){
                cb(err);
            });
        })
        .catch(function(err){
          cb(err);
        });
    })
    .catch(function(err){
      cb(err);
    });
  },
  encrypt: function(text, key) {
    try {
      const iv = crypto.randomBytes(enc.defaults.iv_len),
        cipher = crypto.createCipheriv(
          [enc.defaults.cipher, enc.defaults.bit_len, 'gcm'].join('-'),
          Buffer.from(key, enc.defaults.encode),
          iv
        ),
        encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(enc.defaults.encode);
    } catch (err) {
      if (err) {
        return console.error(err)
      }
    }
  },
  decrypt: function(encdata, key) {
    try {
      let tag_slice = enc.defaults.iv_len + enc.defaults.tag_len;
      encdata = Buffer.from(encdata, enc.defaults.encode);
      const decipher = crypto.createDecipheriv(
        [enc.defaults.cipher, enc.defaults.bit_len, 'gcm'].join('-'),
        Buffer.from(key, enc.defaults.encode),
        encdata.slice(0, enc.defaults.iv_len)
      );
      decipher.setAuthTag(encdata.slice(enc.defaults.iv_len, tag_slice));
      return decipher.update(encdata.slice(tag_slice), 'binary', 'utf8') + decipher.final('utf8');
    } catch (err) {
      if (err) {
        return console.error(err)
      }
    }
  },
  rsa_oaep_enc: function(key, ptext, cb){
    key = jp(Buffer.from(key, 'hex').toString())
    wc.importKey("jwk",key,{name: "RSA-OAEP",hash:{name: "SHA-512"}},true,["encrypt"])
    .then(function(publicKey){
      wc.encrypt({name: "RSA-OAEP"},publicKey, Buffer.from(ptext))
      .then(function(ctext){
        cb(false, Buffer.from(ctext).toString('hex'))
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });

  },
  enc_contact: function(obj, key, sig, out) {

    if (typeof obj === 'object') {
      let ptext = js(obj);
      let test_arr = ['name', 'subject', 'msg'],
      key_arr = Object.keys(obj),
      ctext;

      for (let i = 0; i < test_arr.length; i++) {
        if (!obj[test_arr[i]] || obj[test_arr[i]] === '') {
          ss.set('msg_stat', false);
          return out.value = 'all fields must be filled out'
        }

        if (test_arr[i] !== 'msg') {
          if (obj[test_arr[i]].length < 2 || obj[test_arr[i]].length > 32) {
            ss.set('msg_stat', false);
            return out.value = test_arr[i] + ' must be between 2 - 32 characters in length';
          }
        }

      }

      if (!enc.is_letters(obj.name)) {
        ss.set('msg_stat', false);
        return out.value = 'name can only contain letters'
      }

      if (!enc.is_alphanumeric(obj.subject)) {
        ss.set('msg_stat', false);
        return out.value = 'subject can only contain letters and numbers'
      }

      for (let i = 0; i < test_arr.length; i++) {
        ctext = enc.encrypt(obj[test_arr[i]], key);
        if(obj[test_arr[i]] === enc.decrypt(ctext, key)){
          obj[test_arr[i]] = ctext;
        } else {
          ss.set('msg_stat', false);
          return out.value = 'Fatal crypto key error. you must reset your key'
        }
      }

      ctext = null;

      obj.id = Date.now();

      enc.ecdsa_sign(sig, obj.msg, function(err,res){
        if(err){
          ss.set('msg_stat', false);
          return cl(err)
        }
        obj.sig = res;
        out.value = js(obj);
        ss.set('msg_stat', true);
      })

    } else {
      out.value = 'invalid data'
      ss.set('msg_stat', false);
    }

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
