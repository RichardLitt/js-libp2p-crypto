'use strict'

const multihashing = require('multihashing')
const protobuf = require('protocol-buffers')

const crypto = require('../crypto')
const pbm = protobuf(require('../crypto.proto'))

class RsaPublicKey {
  constructor (key) {
    this._key = key
  }

  verify (data, sig, callback) {
    crypto.hashAndVerify(this._key, sig, data, callback)
  }

  marshal () {
    return this._key
  }

  get bytes () {
    return pbm.PublicKey.encode({
      Type: pbm.KeyType.RSA,
      Data: this.marshal()
    })
  }

  encrypt (bytes) {
    return this._key.encrypt(bytes, 'RSAES-PKCS1-V1_5')
  }

  equals (key) {
    return this.bytes.equals(key.bytes)
  }

  hash (callback) {
    multihashing(this.bytes, 'sha2-256', callback)
  }
}

class RsaPrivateKey {
  constructor (key, publicKey) {
    this._key = key
    this._publicKey = publicKey
  }

  genSecret () {
    return crypto.getRandomValues(new Uint8Array(16))
  }

  sign (message, callback) {
    crypto.hashAndSign(this._key, message, callback)
  }

  get public () {
    if (!this._publicKey) {
      throw new Error('public key not provided')
    }

    return new RsaPublicKey(this._publicKey)
  }

  decrypt (msg, callback) {
    crypto.decrypt(this._key, msg, callback)
  }

  marshal () {
    return this._key
  }

  get bytes () {
    return pbm.PrivateKey.encode({
      Type: pbm.KeyType.RSA,
      Data: this.marshal()
    })
  }

  equals (key) {
    return this.bytes.equals(key.bytes)
  }

  hash (callback) {
    multihashing(this.bytes, 'sha2-256', callback)
  }
}

function unmarshalRsaPrivateKey (bytes) {
  return new RsaPrivateKey(bytes)
}

function unmarshalRsaPublicKey (bytes) {
  return new RsaPublicKey(bytes)
}

function generateKeyPair (bits, cb) {
  crypto.generateKey(bits, (err, key, publicKey) => {
    if (err) {
      return cb(err)
    }

    cb(null, new RsaPrivateKey(key, publicKey))
  })
}

module.exports = {
  RsaPublicKey,
  RsaPrivateKey,
  unmarshalRsaPublicKey,
  unmarshalRsaPrivateKey,
  generateKeyPair
}
