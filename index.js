const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req, res) => {
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
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log('returning this response ' + statusCode, payloadString);
    });
  });
});

server.listen(3000, () => {
  console.log('server is running on port ' + 3000);
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
