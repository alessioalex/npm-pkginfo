"use strict";

var CacheStore = {};

CacheStore.get = function(name) {};
/**
 * Set cache for a package, and etag also.
 * The callback is optional
 */

CacheStore.set = function(name, val, etag, cb) {};

CacheStore.del = function(name, cb) {};

/**
 * Empties the whole cache
 */
CacheStore.reset = function(cb) {};

/**
* Retrieves the etag for a package
*/
CacheStore.getEtag = function(name, cb) {};

CacheStore.delEtag = function(name, cb) {};

module.exports = CacheStore;
