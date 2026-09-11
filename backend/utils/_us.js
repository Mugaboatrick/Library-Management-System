const http = require('http');
function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const r = http.request({ host: 'localhost', port: 5000, path, method, headers }, (res) => {
      let out = '';
      res.on('data', (d) => (out += d));
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}
(async () => {
  const login = await req('POST', '/api/auth/login', { email: 'librarian@hopehaven.edu', password: 'admin123' });
  const token = JSON.parse(login.body).token;
  const u = await req('GET', '/api/users?limit=300', null, token);
  const rows = JSON.parse(u.body).data;
  console.log('users:', u.status, rows.length);
  const sample = rows.slice(0, 4).map(x => `${x.id} ${x.first_name} ${x.last_name} | ${x.customer_id} | ${x.role}`);
  sample.forEach(s => console.log(' ', s));
})()