const http = require('http');

const data = JSON.stringify({ 
  data: { participant_name: "Test", activity: "HORA_DEL_CUENTO", activity_date: new Date().toISOString() }, 
  reservation_token: "fake-token" 
});

const req = http.request('http://localhost:80/api/forms/EventRegistration/submissions', {
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
    console.log(body);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
