# 🔧 故障排查指南

## 🚨 常见问题及解决方案

### 1. 登录失败：用户名或密码错误

**症状**：
- 登录页面显示"登录失败,请检查用户名和密码"
- 浏览器控制台可能有网络错误

**可能原因**：

#### A. 后端服务器未启动

**检查**：
```bash
# 检查后端是否在运行
cd E:\node\enbonadmin\backend
netstat -ano | findstr :3000
```

**解决**：
```bash
# 启动后端服务器
cd E:\node\enbonadmin\backend
npm run start:dev

# 等待看到这些信息表示成功启动：
# 🚀 Backend server running on http://localhost:3000
# ✅ 默认管理员账户已创建: admin / 123456
```

#### B. 数据库未创建

**检查**：
```bash
cd E:\node\enbonadmin\backend
dir data
```

如果 `data` 目录为空，数据库未创建。

**解决**：
```bash
# 确保 data 目录存在
mkdir data

# 重启后端服务器，会自动创建数据库
npm run start:dev
```

#### C. CORS跨域问题

**检查**：
打开浏览器控制台（F12），查看网络请求是否被阻止。

**解决**：
检查 `backend/src/main.ts` 中的 CORS 配置：
```typescript
app.enableCors({
  origin: 'http://localhost:5173', // 确保这个地址正确
  credentials: true,
});
```

#### D. API路由错误

**检查**：
在浏览器访问 http://localhost:3000/api/auth/login，应该返回方法不允许的错误（不是404）。

**解决**：
检查 `backend/src/main.ts` 中是否设置了全局前缀：
```typescript
app.setGlobalPrefix('api');
```

#### E. 默认管理员账户未创建

**检查**：
```bash
# 使用数据库查看工具打开
cd E:\node\enbonadmin\backend\data
# 打开 enbon-admin.db，查看 users 表
```

**解决**：
1. 删除数据库文件
2. 重启后端服务器
3. 查看启动日志，应该看到 "✅ 默认管理员账户已创建"

### 2. 前端页面空白

**症状**：
- 浏览器显示白色空白页
- 控制台有错误信息

**可能原因**：

#### A. 路由错误

**检查**：
浏览器控制台是否有 `RouteRecordRaw` 相关错误

**解决**：
确保 `frontend/src/router/index.ts` 使用正确的类型导入：
```typescript
import type { RouteRecordRaw } from 'vue-router'
```

#### B. SCSS依赖缺失

**检查**：
浏览器控制台是否有 "sass-embedded not found" 错误

**解决**：
```bash
cd E:\node\enbonadmin\frontend
npm install -D sass-embedded
npm run dev
```

#### C. TypeScript严格模式错误

**检查**：
浏览器控制台是否有类型相关错误

**解决**：
检查 `frontend/tsconfig.app.json`，确保没有 `erasableSyntaxOnly: true`。

### 3. 端口被占用

**症状**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决**：
```bash
# Windows PowerShell
netstat -ano | findstr :3000
# 记下 PID 号
taskkill /PID <PID号> /F

# 或修改端口
# 编辑 backend/.env
PORT=3001
```

### 4. 模块未找到错误

**症状**：
```
Cannot find module 'xxx'
```

**解决**：
```bash
# 删除依赖重新安装
cd E:\node\enbonadmin\backend
rm -rf node_modules package-lock.json
npm install

cd ..\frontend
rm -rf node_modules package-lock.json
npm install
```

### 5. Vite热重载不工作

**症状**：
修改代码后页面不自动刷新

**解决**：
```bash
# 清理缓存
cd E:\node\enbonadmin\frontend
rm -rf .vite node_modules/.vite
npm run dev
```

## 🧪 测试步骤

### 1. 测试后端

```bash
# 1. 检查后端是否启动
curl http://localhost:3000/api

# 2. 测试登录API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"123456\"}"

# 应该返回 token 和用户信息
```

### 2. 测试前端

```bash
# 1. 检查前端是否启动
curl http://localhost:5173

# 2. 在浏览器打开开发者工具（F12）
# 3. 查看 Console 和 Network 标签
```

## 📝 启动检查清单

### ✅ 启动前检查

- [ ] Node.js 已安装（版本 >= 16）
- [ ] npm 已安装
- [ ] 端口 3000 未被占用
- [ ] 端口 5173 未被占用
- [ ] backend/data 目录存在
- [ ] backend/storage 目录存在

### ✅ 启动后端

```bash
cd E:\node\enbonadmin\backend
npm run start:dev
```

**等待看到**：
- ✅ Backend server running on http://localhost:3000
- ✅ 默认管理员账户已创建: admin / 123456

### ✅ 启动前端

```bash
cd E:\node\enbonadmin\frontend
npm run dev
```

**等待看到**：
- ✅ Local: http://localhost:5173/
- ✅ Network: use --host to expose

### ✅ 测试登录

1. 打开浏览器访问 http://localhost:5173
2. 应该自动跳转到 /login
3. 输入：
   - 用户名：`admin`
   - 密码：`123456`
4. 点击登录
5. 应该成功跳转到首页

## 🆘 仍然无法解决？

1. **查看日志**：
   - 后端日志在启动的终端窗口中
   - 前端日志在浏览器控制台（F12）

2. **检查文件**：
   - `backend/.env` 是否存在
   - `backend/data/enbon-admin.db` 是否存在
   - 所有依赖是否都已安装

3. **重新开始**：
```bash
# 完全清理并重新安装
cd E:\node\enbonadmin

# 清理后端
cd backend
rm -rf node_modules dist data/*.db .env
npm install
npm run start:dev

# 清理前端（新开终端）
cd ..\frontend
rm -rf node_modules .vite
npm install
npm run dev
```

4. **查看文档**：
   - `README.md` - 项目说明
   - `QUICK_START.md` - 快速启动
   - `architecture.md` - 架构文档

---

**如果问题持续存在，请提供详细的错误信息以便进一步诊断。**

