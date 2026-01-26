# 🚀 后端启动指南

## 快速启动

### Windows PowerShell

```powershell
# 1. 进入后端目录
cd E:\node\enbonadmin\backend

# 2. 确保依赖已安装
npm install

# 3. 启动开发服务器
npm run start:dev
```

### 预期输出

如果启动成功，您应该看到：

```
[Nest] Starting Nest application...
[Nest] Nest application successfully started
🚀 Backend server running on http://localhost:3002
✅ 默认管理员账户已创建: admin / 123456
```

### 检查数据库

启动成功后，检查 `backend/data/` 目录：

```powershell
dir backend\data
```

应该能看到 `enbon-admin.db` 文件。

## 常见问题

### 1. 编译错误

**错误信息**：`Found X errors...`

**解决方法**：
1. 检查 TypeScript 类型错误
2. 查看终端中的错误详情
3. 修复代码后自动重新编译

### 2. 端口被占用

**错误信息**：`EADDRINUSE: address already in use :::3002`

**解决方法**：
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3002


# 杀掉进程（替换<PID>为实际进程号）
taskkill /PID <PID> /F
```

### 3. 数据库文件未创建

**检查项**：
1. 确保 `data` 目录存在
2. 确保没有文件权限问题
3. 检查日志中是否有数据库错误

**解决方法**：
```powershell
# 删除旧数据库（如果存在）
rm -rf data\*.db

# 重启服务器
npm run start:dev
```

### 4. 依赖缺失

**错误信息**：`Cannot find module 'xxx'`

**解决方法**：
```powershell
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## 手动测试

### 测试登录API

```powershell
# 使用curl测试登录
curl -X POST http://localhost:3002/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"123456\"}"

# 应该返回JSON格式的token和用户信息
```

### 测试数据库

使用数据库工具（如 DB Browser for SQLite）打开：
```
E:\node\enbonadmin\backend\data\enbon-admin.db
```

检查 users 表是否有数据。

## 开发模式

后端支持热重载，修改代码后会自动重新编译并重启。

## 生产部署

```powershell
# 构建项目
npm run build

# 启动生产服务器
npm run start:prod
```

---

**如果问题持续，请查看终端中的详细错误信息。**

