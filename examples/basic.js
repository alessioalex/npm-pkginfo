var Client = require('../'),
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
