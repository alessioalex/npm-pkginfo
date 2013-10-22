var Client     = require('../'),
    nock       = require('nock'),
    should     = require('should'),
    after      = require('after'),
    errTo      = require('errto'),
    MemStore   = require('../lib/store/memory'),
    reqPkgJson = require('./fixtures/request-module.json'),
    NPM_REGISTRY_LINK = 'http://registry.npmjs.org';

describe('Client', function() {
  var client, cacheStore;

  cacheStore = new MemStore();
  client = new Client({ cacheStore: cacheStore });

  beforeEach(function(done) {
    nock.cleanAll();
    cacheStore.reset(done);
  });

  it('should get pkg info', function(done) {
    nock(NPM_REGISTRY_LINK)
      .get('/request')
      .reply(200, reqPkgJson);

    client.get('request', errTo(done, function(info) {
      info.should.eql(reqPkgJson);
      done();
    }));
  });

  it("should throw error in case pkg doesn't exist", function(done) {
    var name = 'packageName';

    nock(NPM_REGISTRY_LINK)
      .get('/' + name)
      .once()
      .reply(500, 'get lost');

    nock(NPM_REGISTRY_LINK)
      .get('/' + name)
      .twice()
      .reply(404, 'not found');

    nock(NPM_REGISTRY_LINK)
      .get('/' + name)
      .thrice()
      .reply(413, 'some weird status');

    client.get(name, function(err, info) {
      err.should.be.instanceof(Error);
      client.get(name, function(err, info) {
        err.should.be.instanceof(Error);
        client.get(name, function(err, info) {
          err.should.be.instanceof(Error);
          done();
        });
      });
    });
  });

  it('should load from cache second time (if not modified)', function(done) {
    var path = '/request';

    nock(NPM_REGISTRY_LINK)
      .get(path)
      .once()
      .reply(200, reqPkgJson, {
        'etag': 'some_random_id_here'
      });

    nock(NPM_REGISTRY_LINK)
      .get(path)
      .twice()
      .reply(304, 'nada');

    client.get('request', errTo(done, function(info) {
      info.should.eql(reqPkgJson);

      client.get('request', errTo(done, function(info) {
        info.should.eql(reqPkgJson);

        done();
      }));
    }));
  });

  it('should be able to force loading from cache', function(done) {
    var name  = 'request',
        name2 = 'unknown',
        next;

    next = after(2, function() {
      done();
    });

    nock(NPM_REGISTRY_LINK)
      .get('/' + name)
      .once()
      .reply(403, 'you should not be here!!');

    nock(NPM_REGISTRY_LINK)
      .get('/' + name2)
      .once()
      .reply(403, 'you should not be here!!');

    cacheStore.set(name, reqPkgJson, 'etag', errTo(done, function() {
      client.get(name, { staleOk: true }, errTo(done, function(info) {
        info.should.eql(reqPkgJson);

        next();
      }));
    }));

    // if nothing is in the cache, it should fetch from the registry
    client.get(name2, { staleOk: true }, function(err, info) {
      err.should.be.instanceof(Error);

      next();
    });

  });

});
