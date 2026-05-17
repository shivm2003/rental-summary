const http = require('http');

const data = JSON.stringify({
  identifier: '2003shiv1990@gmail.com',
  password: 'test'
});

const options = {
  hostname: '127.0.0.1',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', responseData));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
