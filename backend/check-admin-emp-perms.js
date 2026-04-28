const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin' });

pool.query(`
  SELECT p.code FROM role_permissions rp
  JOIN permissions p ON rp."permissionId" = p.id
  JOIN roles r ON rp."roleId" = r.id
  WHERE r."isSuperAdmin" = true AND p.code LIKE 'employee.manage%'
`).then(r => {
  console.log('Admin role employee.manage permissions:', r.rows);
}).finally(() => pool.end());
