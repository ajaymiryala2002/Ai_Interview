const http = require('http');
const fs = require('fs');

const API = '127.0.0.1';
const PORT = 5000;

function request(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const options = { hostname: API, port: PORT, path, method, headers };
    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const email = 'debug' + Date.now() + '@pyproctor.local';
  console.log('1. Registering organizer:', email);
  const reg = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, JSON.stringify({ name: 'Debug', email, password: 'debug1234', org_name: 'Debug' }));
  console.log('   Register:', reg.status, reg.body);

  console.log('2. Logging in');
  const login = await request('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, JSON.stringify({ email, password: 'debug1234' }));
  console.log('   Login:', login.status, login.body);
  const token = JSON.parse(login.body).token;

  console.log('3. Adding candidate');
  const boundary = '----DebugBoundary' + Date.now();
  const imageData = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const candidateEmail = email.replace('@', '+candidate@');
  const pre = [
    '--' + boundary + '\r\nContent-Disposition: form-data; name="name"\r\n\r\nDebug Candidate\r\n',
    '--' + boundary + '\r\nContent-Disposition: form-data; name="email"\r\n\r\n' + candidateEmail + '\r\n',
    '--' + boundary + '\r\nContent-Disposition: form-data; name="role"\r\n\r\nGeneral\r\n',
    '--' + boundary + '\r\nContent-Disposition: form-data; name="image"; filename="debug.gif"\r\nContent-Type: image/gif\r\n\r\n'
  ];
  const post = ['\r\n--' + boundary + '--\r\n'];
  const body = Buffer.concat([
    ...pre.map(s => Buffer.from(s, 'utf8')),
    imageData,
    ...post.map(s => Buffer.from(s, 'utf8'))
  ]);

  const add = await request('POST', '/api/candidates', { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + boundary }, body);
  console.log('   Add candidate:', add.status, add.body);
  const candidateId = JSON.parse(add.body).id;

  console.log('4. Calling grant-access for', candidateId);
  const start = Date.now();
  try {
    const grant = await request('POST', '/api/candidates/' + candidateId + '/grant-access', { 'Authorization': 'Bearer ' + token });
    console.log('   Grant access (' + (Date.now() - start) + 'ms):', grant.status, grant.body);
  } catch (err) {
    console.error('   Grant access failed (' + (Date.now() - start) + 'ms):', err.message);
  }
})();
