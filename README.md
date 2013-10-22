## npm-pkginfo

Lightweight version of [npm-registry-client.get()](https://github.com/isaacs/npm-registry-client#clientgeturl-timeout-nofollow-staleok-cb) that supports custom cache stores.

### Motivation

I wrote this module because `npm-registry-client` was missing some features and had others which I didn't need:
- it didn't allow custom cache stores
- event though it could load the package info from the cache it did a background update after that

### Usage

```js
var Client = require('npm-pkginfo'),
    client;

// note: the memory store is only for testing / examples
// in production you should either use the fsStore (see commented lines below)
// or another custom store
client = new Client({
  cacheStore: new Client.stores.memory()
});

// Uncomment below to use the fs cache store
// client = new Client({
//   cacheDir: __dirname + '/cache'
// });

// fetch the request module from NPM
client.get('request', function(err, info) {
  if (err) { throw err; }

  console.log('Request versions: ', Object.keys(info.versions).join(', '));
  console.log('---');

  // this time it will load the info from the cache, without making any requests to NPM
  client.get('request', { staleOk: true }, function(err, info) {
    if (err) { throw err; }

    console.log('Request versions: ', Object.keys(info.versions).join(', '));
  });
});
```

For advanced usage, read the tests.

### LICENSE

MIT
