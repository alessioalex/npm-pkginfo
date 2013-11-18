"use strict";

var request    = require('request'),
    once       = require('once'),
    JSONStream = require('JSONStream'),
    Err        = require('custom-err'),
    errTo      = require('errto'),
    FsStore    = require('./lib/store/fs'),
    MemStore   = require('./lib/store/memory');

function Client(opts) {
  var opts, REGISTRY_URL;

  opts = opts || {};
  this.REGISTRY_URL = opts.REGISTRY_URL || 'http://registry.npmjs.org';
  this.REGISTRY_URL = this.REGISTRY_URL.replace(/\/$/, '');

  if (!opts.cacheStore) {
    this.cacheStore = new FsStore({ dir: opts.cacheDir });
  } else {
    this.cacheStore = opts.cacheStore;
  }
}

Client.prototype._handleByStatusCode = function(name, statusCode, callbacks) {
  if (statusCode === 200) {
    callbacks.success();
  } else if (statusCode === 304) {
    callbacks.cache();
  } else if (/^4/.test(statusCode)) {
    callbacks.err(Err('npm-pkginfo: ClientError: ' + statusCode + ' package: ' + name, {
      code        : statusCode,
      clientError : true,
      pkg         : name,
      registry    : this.REGISTRY_URL
    }));
  } else if (/^5/.test(statusCode)) {
    callbacks.err(Err('npm-pkginfo: ServerError: ' + statusCode + ' package: ' + name, {
      code        : statusCode,
      serverError : true,
      pkg         : name,
      registry    : this.REGISTRY_URL
    }));
  } else {
    // bad statusCode
    callbacks.err(Err('npm-pkginfo: Bad statusCode: ' + statusCode + ' package: ' + name, {
      code          : statusCode,
      badStatusCode : true,
      pkg           : name,
      registry      : this.REGISTRY_URL
    }));
  }
};

Client.prototype.get = function(name, opts, callback) {
  var that;

  if (typeof opts === 'function') {
    callback = opts;
    opts     = {};
  }
  callback = once(callback);
  that     = this;

  if (opts.staleOk) {
    // try to fetch from cache
    this.cacheStore.get(name, errTo(callback, function(data) {
      if (data) {
        callback(null, data);
      } else {
        // if nothing in cache, fetch from registry
        that.fetch(name, callback);
      }
    }));
  } else {
    this.fetch(name, callback);
  }
};

Client.prototype.fetch = function(name, callback) {
  var that = this;

  callback = once(callback);

  this.cacheStore.getEtag(name, errTo(callback, function(etag) {
    var opts, req;

    opts = {
      url     : that.REGISTRY_URL + '/' + name,
      method  : 'GET',
      headers : {},
      timeout : 120000, // 2 mins
      followRedirect : false
    };

    if (etag) { opts.headers['If-None-Match'] = etag; }

    req = request(opts);

    req.on('response', function(res) {
      that._handleByStatusCode(name, res.statusCode, {
        err     : callback,
        success : function() {
          var result = {};

          req.pipe(JSONStream.parse())
            .on('data', function(data) {
              // data event is called only once
              result = data;
            }).on('end', function() {
              that.cacheStore.set(name, result, res.headers.etag);
              callback(null, result);
            });
        },
        cache : function notModified() {
          that.cacheStore.get(name, callback);
        }
      });
    });

    req.on('error', callback);

  }));
};

Client.stores = {
  fs     : FsStore,
  memory : MemStore
};

module.exports = Client;
