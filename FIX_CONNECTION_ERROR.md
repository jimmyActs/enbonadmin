# 🔧 解决连接错误指南

## 问题描述

前端页面显示 `ERR_CONNECTION_REFUSED` 错误，无法连接到后端服务器。

**错误信息**：
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
http://localhost:3000/api/files/drives
```

## 原因

后端服务器（运行在 `http://localhost:3000`）没有启动。

## 解决步骤

### 1️⃣ 启动后端服务器

打开**新的命令行窗口**（PowerShell 或 CMD）：

```powershell
cd E:\node\enbonadmin\backend
npm run start:dev
```

**预期输出**：
```
[Nest] Starting Nest application...
[Nest] Dependencies initialized
[Nest] InstanceLoader initialized
[Nest] Routes mapped
🚀 Backend server running on http://localhost:3000
✅ 默认管理员账户已创建: admin / 123456
```

### 2️⃣ 验证后端运行

在浏览器中访问：`http://localhost:3000/api`

如果看到响应（即使是 404），说明后端已经运行。

### 3️⃣ 刷新前端页面

在浏览器中按 `F5` 或点击刷新按钮，重新加载前端页面。

**预期结果**：
- `ERR_CONNECTION_REFUSED` 错误消失
- 文件管理页面显示存储盘列表
- 不再显示"请选择一个存储盘"的空状态

## 验证步骤

1. ✅ 后端终端显示 "🚀 Backend server running on http://localhost:3000"
2. ✅ 浏览器控制台（F12）没有 `ERR_CONNECTION_REFUSED` 错误
3. ✅ 文件管理页面显示存储盘列表（公共盘、企划部盘等）

## 其他注意事项

### i18n 警告（可选修复）

控制台可能显示：
```
[intlify] Not found 'index.motivations' key in 'zh' locale messages.
[intlify] Not found 'index.greetings.encouragement' key in 'zh' locale messages.
```

这些是翻译键缺失的警告，**不影响功能**。如果需要修复，可以：
1. 检查 `frontend/src/locales/zh-CN/index.ts` 文件
2. 添加缺失的翻译键

### 端口被占用

如果启动后端时提示端口被占用：

```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 杀掉进程（替换<PID>为实际进程号）
taskkill /PID <PID> /F
```

## 快速检查清单

启动前：
- [ ] 后端目录存在：`E:\node\enbonadmin\backend`
- [ ] 后端依赖已安装：`backend/node_modules` 存在
- [ ] 端口 3000 未被占用

启动后：
- [ ] 后端终端显示成功消息
- [ ] 数据库文件已创建：`backend/data/enbon-admin.db`
- [ ] 浏览器能访问 `http://localhost:3000/api`
- [ ] 前端页面不再显示连接错误

---

**如果问题仍然存在，请检查：**
1. 防火墙是否阻止了连接
2. 后端终端是否有错误信息
3. 浏览器控制台的完整错误信息

