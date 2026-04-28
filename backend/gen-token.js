const jwt = require('jsonwebtoken');
const SECRET = 'f6d8f936e81dbf9a247c6da1f7cadd852fb1f207d4c151ccd7ea17c539541e450405c8d1bbb13b8e61c4c596951cb26529fe6ec8108f25fd6f2ac5414e5c1206';
const token = jwt.sign({ sub: 1, role: 'super_admin' }, SECRET, { expiresIn: '1h' });
console.log(token);
