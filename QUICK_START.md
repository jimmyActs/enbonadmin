# 🚀 快速启动指南

## 问题：全部功能报错，显示 Network Error

**原因：** 后端服务器没有运行，导致前端无法连接 API。

## 解决方案

### 方法 1：使用启动脚本（推荐）

1. 打开一个新的 **终端/命令提示符** 或 **PowerShell**
2. 进入后端目录：
   ```powershell
   cd E:\node\enbonadmin\backend
   ```
3. 运行启动脚本：
   ```powershell
   .\start.bat
   ```
   或者直接双击 `backend/start.bat` 文件

### 方法 2：手动启动

1. 打开一个新的 **终端/命令提示符** 或 **PowerShell**
2. 进入后端目录：
   ```powershell
   cd E:\node\enbonadmin\backend
   ```
3. 检查依赖是否已安装：
   ```powershell
   dir node_modules
   ```
   如果目录不存在，运行：
   ```powershell
   npm install
   ```
4. 启动开发服务器：
   ```powershell
   npm run start:dev
   ```

### 预期输出

如果启动成功，您应该看到：

```
[Nest] Starting Nest application...
[Nest] Nest application successfully started
🚀 Backend server running on:
   Local:   http://localhost:3002
   Network: http://192.168.x.x:3002
✅ 默认管理员账户已创建: admin / 123456
```

### 验证后端是否运行

在浏览器中访问：http://localhost:3002/api

如果看到 JSON 响应，说明后端已成功启动。

### 常见问题

#### 1. 端口被占用

**错误信息：** `EADDRINUSE: address already in use :::3002`

**解决方法：**
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3002

# 杀掉进程（替换<PID>为实际进程号）
taskkill /PID <PID> /F
```

#### 2. 依赖缺失

**错误信息：** `Cannot find module 'xxx'`

**解决方法：**
```powershell
cd E:\node\enbonadmin\backend
npm install
```

#### 3. 编译错误

检查终端中显示的错误信息，修复代码后服务器会自动重新编译。

## 重要提示

⚠️ **后端服务器必须保持运行**，前端才能正常工作！

- 后端服务需要在独立的终端窗口中运行
- 不要关闭运行后端的终端窗口
- 如果关闭了终端，需要重新启动后端服务

## 启动后的操作

1. 等待后端完全启动（看到 "🚀 Backend server running on..." 消息）
2. 刷新前端页面（http://localhost:5173）
3. 所有功能应该恢复正常

---

**如果问题持续，请检查：**
- Node.js 版本是否正确（建议 v18+）
- 后端目录中是否有 `node_modules` 文件夹
- 终端中是否有错误信息
