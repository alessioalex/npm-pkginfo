var os       = require('os'),
    FsStore  = require('../lib/store/fs'),
    MemStore = require('../lib/store/memory'),
    should   = require('should'),
    errTo    = require('errto'),
    once     = require('once'),
    after    = require('after'),
    stores   = [],
    fsStorePath;

fsStorePath = os.tmpdir() + '/fsStore';

stores.push({
  name   : 'FS',
  client : new FsStore({ dir: fsStorePath })
}, {
  name   : 'Memory',
  client : new MemStore()
});

stores.forEach(function(item) {
  var client = item.client;

  describe(item.name + ' Store', function() {
    var samplePkgInfo = { some: 'properties' },
        samplePkgName = 'somepackage',
        samplePkgEtag = 'asdasdasdasda';

    beforeEach(function(done) {
      client.reset(errTo(done, function() {
        var next, i, count;

        count = 4;
        done  = once(done);
        next  = after(count, done);

        for (i = 0; i < count; i++) {
          client.set(
            samplePkgName + '-' + i,
            samplePkgInfo,
            samplePkgEtag + '-' + i,
            errTo(done, next)
          );
        }
      }));
    });

    it('should set and get item', function(done) {
      var name = samplePkgName + '-2';

      client.get(name, errTo(done, function(info) {
        samplePkgInfo.should.eql(info);
        done();
      }));
    });

    it('should delete item', function(done) {
      var name = samplePkgName + '-2';

      client.del(name, errTo(done, function() {
        client.get(name, errTo(done, function(val) {
          should(!!val).eql(false);
          done();
        }));
      }));
    });

    it('should put the etag along with the item', function(done) {
      var name = samplePkgName + '-2';

      client.getEtag(name, errTo(done, function(etag) {
        (samplePkgEtag + '-2').should.eql(etag);
        done();
      }));
    });

    it('should update the etag along with the item', function(done) {
      var newEtag, name;

      name    = samplePkgName + '-2';
      newEtag = 'aaaaaaab';

      client.set(name, samplePkgInfo, newEtag, errTo(done, function() {
        client.getEtag(name, errTo(done, function(etag) {
          etag.should.eql(newEtag);
          done();
        }));
      }));
    });

    it('should delete the etag', function(done) {
      var name = samplePkgName + '-2';

      client.delEtag(name, errTo(done, function() {
        client.getEtag(name, errTo(done, function(val) {
          should(!!val).eql(false);
          done();
        }));
      }));
    });

  });

});
