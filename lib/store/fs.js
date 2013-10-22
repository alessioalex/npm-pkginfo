"use strict";

var CacheStore = require('./store'),
    fs         = require('graceful-fs'),
    errTo      = require('errto'),
    path       = require('path'),
    noop       = require('nop'),
    rimraf     = require('rimraf'),
    JSONparse  = require('try-json-parse'),
    mkdirp     = require('mkdirp'),
    chownr     = require('chownr');

function FsStore(opts) {
  if (!(this instanceof FsStore)) {
    return new FsStore(opts);
  }

  opts = opts || {};
  if (!opts.dir) {
    throw new Error('Cache dir is required');
  }

  this.dir = opts.dir;
}

FsStore.prototype = Object.create(CacheStore);

/**
 * rm -rf the cache directory
 */
FsStore.prototype.reset = function(cb) {
  rimraf(this.dir, cb);
};

/**
 * Heavily inspired from:
 * https://github.com/isaacs/npm-registry-client/
 * License BSD
 */
FsStore.prototype.set = function(name, val, etag, callback) {
  var that = this;

  callback = callback || noop;

  if (this._cacheStat) {
    var cs = this._cacheStat;
    return this._saveToCache(name, val, etag, cs.uid, cs.gid, callback);
  }

  fs.stat(this.dir, function(err, stat) {
    if (err) {
      return fs.stat(process.env.HOME || "", errTo(callback, function(stat) {
        that._cacheStat = stat;
        return that.set(name, val, etag, callback);
      }));
    }

    that._cacheStat = stat || { uid: null, gid: null };

    return that.set(name, val, etag, callback);
  });
}

/**
 * Heavily inspired from:
 * https://github.com/isaacs/npm-registry-client/
 * License BSD
 */
FsStore.prototype._saveToCache = function(name, val, etag, uid, gid, callback) {
  var that = this;

  mkdirp(this._getPath(name, 'pkg'), errTo(callback, function (err, made) {
    var etagPath, cachePath;

    cachePath = that._getPath(name, 'cache');
    fs.writeFile(cachePath, JSON.stringify(val), function (err) {
      if (err || uid === null || gid === null) {
        return callback();
      }
      chownr(made || cachePath, uid, gid, callback);
    });

    etagPath = that._getPath(name, 'etag');
    fs.writeFile(etagPath, etag, function(err) {
      if (!err) { fs.chown(etagPath, uid, gid, noop); }
    });
  }));
};

FsStore.prototype._getPath = function(name, type) {
  var pkgPath = path.join(this.dir, name);

  if (type === 'pkg') {
    return pkgPath;
  } else {
    return (type === 'cache') ? path.join(pkgPath, 'cache.json')
                              : path.join(pkgPath, 'etag.txt');
  }
};

FsStore.prototype.get = function(name, callback) {
  var cachePath;

  cachePath = this._getPath(name, 'cache');

  fs.exists(cachePath, function(exists) {
    if (!exists) { return callback(null, null); }

    fs.readFile(cachePath, { encoding: 'utf8' }, errTo(callback, function(content) {
      callback(null, JSONparse(content));
    }));
  });
};

FsStore.prototype.del = function(name, callback) {
  callback = callback || noop;
  this._delFile(name, 'cache', callback);
};

FsStore.prototype.getEtag = function(name, callback) {
  var etagPath;

  etagPath = this._getPath(name, 'etag');

  fs.exists(etagPath, function(exists) {
    if (!exists) { return callback(null, null); }

    fs.readFile(etagPath, { encoding: 'utf8' }, errTo(callback, function(content) {
      callback(null, content);
    }));
  });
};

FsStore.prototype.delEtag = function(name, callback) {
  this._delFile(name, 'etag', callback);
};

FsStore.prototype._delFile = function(name, type, callback) {
  var itemPath;

  callback = callback || noop;

  itemPath = (type === 'cache') ? this._getPath(name, 'cache')
                                : this._getPath(name, 'etag');

  fs.exists(itemPath, function(exists) {
    if (!exists) { return callback(); }

    fs.unlink(itemPath, callback);
  });
};

module.exports = FsStore;
