const crypto = require('crypto');

const enc = {
  rand: function(i){
    return crypto.randomBytes(i);
  },
  hex_dec: function(i){
    return Buffer.from(i, 'hex').toString('binary');
  },
  hex_enc: function(i){
    return Buffer.from(i, 'binary').toString('hex');
  },
  hash512: function(data){
    return crypto.createHash('sha512').update(data).digest('hex')
  },
  hmac: function(secret, data){
    try {
      const sig = crypto.createHmac('sha512', secret);
      sig.update(data);
      return sig.digest('hex');
    } catch (err) {
      throw new ERROR('hmac tamper');
    }
  },
  rand_u8: function(len){
    return window.crypto.getRandomValues(new Uint8Array(len));
  },
  hex2u8: function(hex) {
      return new Uint8Array(Buffer.from(hex, 'hex'))
  },
  u82hex: function(arr){
    return Buffer.from(arr).toString('hex');
  },
  rsa_oaep_keygen: function(cb){
    window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: {name: "SHA-512"},
        },
        true,
        ["encrypt", "decrypt"]
    )
    .then(function(key){
      let obj = {};
      window.crypto.subtle.exportKey("jwk", key.publicKey)
      .then(function(publicData){
        obj.public = publicData
        window.crypto.subtle.exportKey("jwk", key.privateKey)
        .then(function(privateData){
          obj.private = privateData;
          cb(false, obj);
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
  aes_gcm_keygen: function(cb){
    window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    )
    .then(function(key){
      window.crypto.subtle.exportKey("raw", key)
      .then(function(keydata){
        keydata = new Uint8Array(keydata);
        cb(false, keydata)
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });
  },
  aes_gcm_dec: function(obj, data, cb){

    window.crypto.subtle.importKey(
        "raw",
        enc.hex2u8(obj.key),
        {name: "AES-GCM"},
        false,
        ["encrypt", "decrypt"]
    )
    .then(function(key){

      window.crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: enc.hex2u8(obj.iv),
            tagLength: 128,
          },
          key,
          enc.hex2u8(data)
      )
      .then(function(decrypted){
        let ptext = new TextDecoder().decode(new Uint8Array(decrypted));
        cb(false, ptext);
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });

  },
  aes_gcm_enc: function(key, data, cb){

    window.crypto.subtle.importKey(
        "raw",
        key,
        {name: "AES-GCM"},
        false,
        ["encrypt", "decrypt"]
    )
    .then(function(key){

      let obj = {
        iv: window.crypto.getRandomValues(new Uint8Array(12))
      }
      window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: obj.iv,
            tagLength: 128
          },
        key,
        new TextEncoder().encode(data)
      )
      .then(function(encrypted){
        obj.data = enc.u82hex(new Uint8Array(encrypted));
        cb(false, obj);
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });

  },
  rsa_oaep_dec: function(prvKey, obj, cb){
    window.crypto.subtle.importKey(
      "jwk",
      prvKey,
      {
        name: "RSA-OAEP",
        hash: {
          name: "SHA-512"
        }
      },
      false,
      ["decrypt"]
    )
    .then(function(key){
      window.crypto.subtle.decrypt({name: "RSA-OAEP"},key, obj.data)
      .then(function(decrypted){
        decrypted = new Uint8Array(decrypted);
        if(!obj.u8){
          decrypted = new TextDecoder().decode(decrypted);
        }
        cb(false, decrypted);
      })
      .catch(function(err){
        cb(err);
      });

    })
    .catch(function(err){
      cb(err);
    });
  },
  rsa_aes_dec: function(obj, privateKey, cb){
    enc.rsa_oaep_dec(privateKey, {data: enc.hex2u8(obj.ctext), u8: false}, function(err, res){
      if(err){
        return cb(err)
      }
      res = JSON.parse(res);
      enc.aes_gcm_dec(res, obj.data, function(err, ptext){
        if(err){return cb(err)}
        cb(false, ptext);
      })

    })
  },
  rsa_oaep_enc: function(pubKey, obj, cb){

    if(!obj.u8 || obj.u8 === false){
      obj.data = new TextEncoder().encode(obj.data);
    }

    window.crypto.subtle.importKey(
      "jwk",
      pubKey,
      {
        name: "RSA-OAEP",
        hash: {
          name: "SHA-512"
        }
      },
      true,
      ["encrypt"]
    )
    .then(function(key){

      window.crypto.subtle.encrypt({name: "RSA-OAEP"}, key, obj.data)
      .then(function(encrypted){
         cb(false, new Uint8Array(encrypted));
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });
  },
  rsa_aes_enc: function(ptext, publicKey, cb){
    enc.aes_gcm_keygen(function(err, key){
      if(err){return ce(err)}
       let obj = {
         key: enc.u82hex(key)
       }

       enc.aes_gcm_enc(key, ptext, function(err, res){
         if(err){return ce(err)}
         let final = {
           data: res.data
         }
         obj.iv = enc.u82hex(res.iv);
         enc.rsa_oaep_enc(publicKey, {data: js(obj), u8: false}, function(err, ctext){
          if(err){return ce(err)}

           final.ctext = enc.u82hex(ctext);
           cb(false, final)
         })

       })

    })
  },
  enc_contact: function(obj, out, key, pk, keypair){

    if(!ls.get('id') || ls.get('id') === ''){
      utils.toast('danger','id has been tampered with. sending such a message would result in you being blacklisted.');
      setTimeout(function(){
        location.reload()
      },3000)
      return;
    }

    if(typeof obj === 'object'){
      let ptext = js(obj);
      let test_arr = ['name','subject','email','msg'],
      key_arr = Object.keys(obj);

      for (let i = 0; i < test_arr.length; i++) {
        if(!obj[test_arr[i]] || obj[test_arr[i]] === ''){
          return out.value = 'all fields must be filled out'
        }

        if(test_arr[i] !== 'msg'){
          if(obj[test_arr[i]].length < 2 || obj[test_arr[i]].length > 32){
            return out.value = test_arr[i] +' must be between 2 - 32 characters in length';
          }
        }

      }

      if(!enc.is_letters(obj.name)){
        return out.value = 'name can only contain letters'
      }

      if(!enc.is_alphanumeric(obj.subject)){
        return out.value = 'subject can only contain letters and numbers'
      }

      if(!enc.is_email(obj.email)){
        return out.value = 'invalid email address'
      }

      enc.rsa_aes_enc(ptext, pk.public, function(err,res){
        if(err){return cl(err)}
        let date = Date.now();
        res.hash = pk.hash;
        res.public = js(keypair.public),
        res.date = date;
        out.value = Buffer.from(js(res)).toString('base64');
        key.value = Buffer.from(
          js({
            private: keypair.private,
            date: date,
            hash: enc.hash512(js(keypair.private))
          })
        ).toString('base64');
      })
    } else {
      out.value = 'invalid data'
    }

  },
  is_email: function(email){
   if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
     return true;
    }
    return false;
  },
  is_letters: function(txt){
    if(txt.match(/^[A-Za-z]+$/)){
      return true;
    }
    return false;
  },
  is_alphanumeric: function(txt){
    if(txt.match(/^[0-9a-zA-Z]+$/)) {
      return true;
    }
    return false;
  }
}

module.exports = enc;
