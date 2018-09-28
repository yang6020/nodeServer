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
    res.end('Hello World\n');
    console.log(
      'Request received on path ' + trimmedPath + ' method is ' + method,
      queryStringObject,
    );
    console.log('buffer data is ' + buffer, headers);
  });
});

server.listen(3000, () => {
  console.log('server is running on port ' + 3000);
});
