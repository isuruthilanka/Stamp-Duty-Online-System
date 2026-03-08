const http = require('http');
http.createServer((req, res) => {
    res.end('Server is up!');
}).listen(5174, '127.0.0.1', () => {
    console.log('Test server running at http://localhost:5174/');
});
