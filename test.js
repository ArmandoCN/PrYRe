const http = require('http');

const data = JSON.stringify({ email: 'admin@example.com', password: 'admin123' });

const req = http.request('http://localhost:80/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(res.statusCode);
    console.log(res.headers['set-cookie']);
    console.log(body);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
