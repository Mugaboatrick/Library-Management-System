const http = require('http');
function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
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
  const list = await req('GET', '/api/ebooks?limit=100', null);
  const rows = JSON.parse(list.body).data;
  console.log('list:', list.status, '| rows:', rows.length);
  for (const r of rows) console.log(`  [${r.id}] ${r.title} | cover: ${r.cover_image || 'null'}`);
})()