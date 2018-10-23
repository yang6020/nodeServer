const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const _data = require('./lib/data');

//TESTING FUNCTIONS

// create newFile with foo:bar
// _data.create('test', 'newFile', { foo: 'bar' }, function(err) {
//   console.log('this is the error', err);
// });

// read newFile
// _data.read('test', 'newFile', function(err, data) {
//   console.log('this is the error', err, 'and this was the data ', data);
// });

// edit newFile by replacing the contents
// _data.update('test', 'newFile', { fizz: 'buzz' }, err => {
//   console.log('this was the error', err);
// });

// delete newFile
// _data.delete('test', 'newFile', err => {
//   console.log('this was the error', err);
// });

// read a file that doesn't exist
// _data.read('test', 'fileHere', function(err, data) {
//   console.log('this is the error', err, 'and this was the data ', data);
// });

var serverOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};

const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});
const httpsServer = https.createServer(serverOptions, (req, res) => {
  unifiedServer(req, res);
});

const unifiedServer = (req, res) => {
  let decoder = new StringDecoder('utf8');
  let buffer = '';
  let headers = req.headers;
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    let parsedUrl = url.parse(req.url, true);
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const queryStringObject = parsedUrl.query;
    let method = req.method.toLowerCase();
    var chosenHandler =
      typeof router[trimmedPath] === 'undefined'
        ? handlers.notFound
        : router[trimmedPath];
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer,
    };
    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode === 'number' ? statusCode : 200;
      payload = typeof payload === 'object' ? payload : {};
      var payloadString = JSON.stringify(payload);
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log('returning this response ' + statusCode, payloadString);
    });
  });
};

httpServer.listen(config.httpPort, () => {
  console.log(
    'server is running on port ' + config.httpPort + ' in ' + config.envName,
  );
});
httpsServer.listen(config.httpsPort, () => {
  console.log(
    'server is running on port ' + config.httpsPort + ' in ' + config.envName,
  );
});

const handlers = {};
handlers.sample = (data, cb) => {
  console.log(data);
  cb(200, { name: 'sampler handler' });
};
handlers.ping = (data, cb) => {
  cb(200);
};

handlers.notFound = (data, cb) => {
  cb(404);
};

const router = {
  sample: handlers.sample,
  ping: handlers.ping,
};
