const http = require('http');
const { pool } = require('../config/db');
function req(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({ host:'localhost', port:5000, path, method, headers:{ 'Content-Type':'application/json', ...(data?{'Content-Length':Buffer.byteLength(data)}:{}), ...(token?{Authorization:`Bearer ${token}`}:{}) } }, (res) => {
      let out=''; res.on('data',d=>out+=d); res.on('end',()=>resolve({status:res.statusCode,body:out}));
    }); r.on('error',reject); if(data) r.write(data); r.end();
  });
}
(async () => {
  const login = await req('/api/auth/login','POST',{email:'student@hopehaven.edu',password:'student123'});
  const {token,user} = JSON.parse(login.body);
  console.log('login:', login.status, user.id);

  const b = await req('/api/borrowings/borrow','POST',{ebook_id:16,due_days:14},token);
  console.log('borrow ebook 16:', b.status, JSON.parse(b.body).message);

  const read = await req(`/api/ebooks/16/read?token=${token}`,'GET');
  console.log('read while borrowed (expect 403):', read.status, '|', JSON.parse(read.body).message || '(file stream)');

  const readOther = await req(`/api/ebooks/8/read?token=${token}`,'GET');
  console.log('read another ebook (expect 200 stream):', readOther.status, '|', JSON.parse(readOther.body).message || '(file stream OK)');

  // cleanup
  const [loan] = await pool.query(`SELECT b.id, c.id AS cid FROM borrowings b JOIN book_copies c ON c.id=b.copy_id WHERE b.user_id=? AND c.copy_code='EBK016-D1' AND b.status IN ('BORROWED','OVERDUE')`, [user.id]);
  for (const l of loan) {
    await pool.query(`DELETE FROM borrowings WHERE id=?`, [l.id]);
    await pool.query(`DELETE FROM book_copies WHERE id=?`, [l.cid]);
    await pool.query(`DELETE FROM books WHERE NOT EXISTS (SELECT 1 FROM book_copies WHERE book_id=books.id)`);
  }
  console.log('cleanup done');
  await pool.end();
})()