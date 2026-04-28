// 用 form-data 库构造正确的 multipart 请求
const http = require('http');
const fs = require('fs');
const XLSX = require('xlsx');

// 用 hr.controller 的 endpoint，它有全局 AuthGuard
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc3NzI2MTc3MiwiZXhwIjoxNzc3MjY1MzcyfQ.WVPZvTRQaYwkZE36d3LkNMTAABvj8RdVCoYw8FBugpo';

function buildMultipart(fields, boundary) {
  const CRLF = '\r\n';
  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    let header;
    if (value instanceof Buffer) {
      header = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="${name}"; filename="${value.filename || 'file.xlsx'}"`,
        `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
        '', ''
      ].join(CRLF);
      parts.push(Buffer.from(header, 'utf-8'));
      parts.push(value);
    } else {
      header = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="${name}"`,
        '', ''
      ].join(CRLF);
      parts.push(Buffer.from(header, 'utf-8'));
      parts.push(Buffer.from(String(value), 'utf-8'));
    }
    parts.push(Buffer.from(CRLF, 'utf-8'));
  }
  parts.push(Buffer.from(`--${boundary}--${CRLF}`, 'utf-8'));
  return Buffer.concat(parts);
}

(async () => {
  // 1. 下载模板
  console.log('=== 1. 下载模板 ===');
  const tpl = await new Promise(resolve => {
    http.get({
      hostname: 'localhost', port: 3002,
      path: '/api/import/hr/employees/template',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const json = JSON.parse(Buffer.concat(chunks).toString());
        resolve(Buffer.from(json.buffer, 'base64'));
      });
    });
  });
  console.log(`模板大小: ${tpl.length}`);

  const wb = XLSX.read(tpl, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('表头行:', rows[1]);

  // 2. 构造测试文件
  const testUser = 'test_emp_' + Date.now();
  const testWB = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(testWB, XLSX.utils.aoa_to_sheet([rows[1], [
    testUser, '自动化员工', 'general_office', 'employee',
    '13900000003', testUser + '@test.com', 'male', '2026-04-27', 'active'
  ]]), '员工花名册');
  const testBuf = XLSX.write(testWB, { type: 'buffer', bookType: 'xlsx' });
  testBuf.filename = testUser + '.xlsx';
  console.log('\n测试用户:', testUser);

  // 3. 测试 hr.controller endpoint (POST /api/hr/employees/import)
  console.log('\n=== 2. 测试 POST /api/hr/employees/import (hr.controller) ===');
  const boundary1 = '----Boundary1' + Date.now();
  const body1 = buildMultipart({ file: testBuf }, boundary1);
  const r1 = await new Promise(resolve => {
    const req = http.request({
      hostname: 'localhost', port: 3002,
      path: '/api/hr/employees/import',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary1}`,
        'Content-Length': body1.length
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, raw: data.substring(0, 300) }); }
      });
    });
    req.on('error', e => resolve({ err: e.message }));
    req.write(body1);
    req.end();
  });
  console.log('状态:', r1.status);
  if (r1.json) console.log(JSON.stringify(r1.json, null, 2));

  // 4. 测试 excel-import.controller endpoint
  console.log('\n=== 3. 测试 POST /api/import/hr/employees/batch (excel-import.controller) ===');
  const boundary2 = '----Boundary2' + Date.now();
  const body2 = buildMultipart({ file: testBuf }, boundary2);
  const r2 = await new Promise(resolve => {
    const req = http.request({
      hostname: 'localhost', port: 3002,
      path: '/api/import/hr/employees/batch',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary2}`,
        'Content-Length': body2.length
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, raw: data.substring(0, 300) }); }
      });
    });
    req.on('error', e => resolve({ err: e.message }));
    req.write(body2);
    req.end();
  });
  console.log('状态:', r2.status);
  if (r2.json) {
    console.log(JSON.stringify(r2.json, null, 2));
    if (r2.json.imported !== undefined) {
      console.log(`\n✅ 导入成功！新增:${r2.json.imported} 更新:${r2.json.updated} 跳过:${r2.json.skipped}`);
    } else {
      console.log(`⚠️ message: ${r2.json.message}`);
    }
  } else {
    console.log(r2.raw || r2.err);
  }
})();
