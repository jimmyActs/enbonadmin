const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin' });

pool.query('SELECT id, username, nickname, role FROM users WHERE id = 1').then(r => {
  console.log('User 1:', JSON.stringify(r.rows, null, 2));
}).finally(() => pool.end());
