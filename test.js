const http = require('http');

const data = JSON.stringify({
  jurusan: "S1 Informatika",
  angkatan: "2020",
  nomorWa: "0812",
  cvUrl: "",
  skills: [],
  interests: []
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/onboarding',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.write(data);
req.end();
