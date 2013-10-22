"use strict";

/**
 * Used only for tests
 */

var CacheStore = require('./store'),
    MemoryStore;

function asyncCall(fn, args) {
  var that;

  if (fn) {
    that = this;
    process.nextTick(function() {
      fn.apply(that, args);
    });
  }
}

MemoryStore = function() {
  if (!(this instanceof MemoryStore)) {
    return new MemoryStore();
  }

  this.ns = {
    items: {},
    etags: {}
  };
};

MemoryStore.prototype = Object.create(CacheStore);

MemoryStore.prototype.get = function(name, cb) {
  asyncCall(cb, [null, this.ns.items[name]]);
};

/**
 * Set cache for a package, and etag also.
 * The callback is optional
 */
MemoryStore.prototype.set = function(name, val, etag, cb) {
  this.ns.items[name] = val;
  this.ns.etags[name] = etag;

  asyncCall(cb, [null]);
};

MemoryStore.prototype.del = function(name, cb) {
  delete this.ns.items[name];
  delete this.ns.etags[name];

  asyncCall(cb, [null]);
};

/**
 * Empties the whole cache
 */
MemoryStore.prototype.reset = function(cb) {
  this.ns = {
    items: {},
    etags: {}
  };

  asyncCall(cb, [null]);
};

/**
* Retrieves the etag for a package
*/
MemoryStore.prototype.getEtag = function(name, cb) {
  asyncCall(cb, [null, this.ns.etags[name]]);
};

MemoryStore.prototype.delEtag = function(name, cb) {
  delete this.ns.etags[name];

  asyncCall(cb, [null]);
};

module.exports = MemoryStore;
