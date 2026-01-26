# 🔍 状态检查清单

## 检查后端是否启动

### 方法1：检查数据库文件

```bash
cd E:\node\enbonadmin\backend\data
dir
```

如果看到 `enbon-admin.db` 文件，说明后端已经成功启动并创建了数据库。

### 方法2：检查端口

打开浏览器访问：`http://localhost:3000/api`

如果返回一些内容（即使是404），说明后端已经在运行。

### 方法3：查看终端输出

在启动后端的命令行窗口中，应该能看到：

```
[Nest] Starting Nest application...
[Nest] Dependencies initialized
[Nest] InstanceLoader initialized
[Nest] Routes mapped
🚀 Backend server running on http://localhost:3000
✅ 默认管理员账户已创建: admin / 123456
```

## 检查前端是否启动

### 方法1：查看终端输出

在启动前端的命令行窗口中，应该能看到：

```
VITE v7.1.12 ready in 400 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 方法2：访问页面

浏览器访问：`http://localhost:5173`

如果看到登录页面，说明前端已经成功启动。

## 常见问题

### 1. 后端启动但无法连接

**症状**：数据库文件存在，但浏览器报 `ERR_CONNECTION_REFUSED`

**可能原因**：
- 后端进程卡住了
- 端口被其他程序占用
- 防火墙阻止了连接

**解决**：
```bash
# 杀死所有Node进程
taskkill /F /IM node.exe

# 重新启动
cd E:\node\enbonadmin\backend
npm run start:dev
```

### 2. 前端无法连接后端

**症状**：前端启动正常，但登录时报错

**检查**：
1. 确认后端在 http://localhost:3000 运行
2. 打开浏览器控制台（F12）查看错误信息
3. 检查网络请求是否到达后端

### 3. 编译错误

**症状**：终端显示TypeScript错误

**解决**：
1. 查看具体错误信息
2. 修复错误
3. 重新编译会自动启动

### 4. 端口被占用

**症状**：`EADDRINUSE: address already in use :::3000`

**解决**：
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 杀掉进程（替换<PID>为实际PID）
taskkill /PID <PID> /F
```

## 快速测试

### 测试后端API

```bash
# 使用curl测试登录
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"123456\"}"
```

如果返回JSON格式的token，说明后端正常工作。

### 测试前端页面

1. 打开浏览器访问：`http://localhost:5173`
2. 应该看到登录页面
3. 输入 admin / 123456
4. 点击登录
5. 应该成功跳转到首页

## ✅ 成功标准

- [ ] 后端编译无错误
- [ ] 后端输出 "🚀 Backend server running on http://localhost:3000"
- [ ] 数据库文件 `enbon-admin.db` 存在
- [ ] 前端输出 "VITE v7.1.12 ready"
- [ ] 浏览器能访问登录页面
- [ ] 登录成功跳转到首页
- [ ] 首页显示励志名言、时钟、汇率等

## 📞 需要帮助？

如果所有步骤都正常但仍然无法访问，请提供：
1. 后端终端的完整输出
2. 前端终端的完整输出
3. 浏览器控制台的错误信息
4. 网络标签中的请求详情

查看 `TROUBLESHOOTING.md` 获取更详细的故障排查指南。

