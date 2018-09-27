const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  // res.end('hello world');
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
});

server.listen(3000, () => {
  console.log('server is running on port ' + 3000);
});
