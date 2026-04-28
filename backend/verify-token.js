const jwt = require('jsonwebtoken');

// 从 .jwt-secret 读取真实密钥
const fs = require('fs');
const secret = fs.readFileSync('e:/node/enbonadmin/backend/.jwt-secret', 'utf-8').trim();
console.log('Secret length:', secret.length);
console.log('Secret (first 20):', secret.substring(0, 20));

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc3NzI2MTc3MiwiZXhwIjoxNzc3MjY1MzcyfQ.WVPZvTRQaYwkZE36d3LkNMTAABvj8RdVCoYw8FBugpo';

try {
  const decoded = jwt.verify(TOKEN, secret);
  console.log('✅ Token 验证成功');
  console.log('Payload:', JSON.stringify(decoded, null, 2));
} catch (e) {
  console.log('❌ Token 验证失败:', e.message);
  // 试试不验证只解码
  const decoded2 = jwt.decode(TOKEN);
  console.log('解码(不验证):', JSON.stringify(decoded2, null, 2));
}
