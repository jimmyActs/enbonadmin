# 多端测试环境配置指南

## 概述
本指南将帮助你配置开发环境，使同一网络下的其他设备可以访问你的后台系统进行测试。

## 配置步骤

### 1. 获取本机IP地址

**Windows:**
```cmd
ipconfig
```
查找 "IPv4 地址"，例如：`192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
# 或
ip addr
```

### 2. 启动后端服务器

后端已经配置为监听 `0.0.0.0`，允许外部访问。

```bash
cd backend
npm run start:dev
```

启动后会显示：
```
🚀 Backend server running on:
   Local:   http://localhost:3002
   Network: http://192.168.1.100:3002
```

### 3. 启动前端开发服务器

前端已经配置为监听 `0.0.0.0`，允许外部访问。

```bash
cd frontend
npm run dev
```

启动后会显示：
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### 4. 在其他设备上访问

确保其他设备与你的电脑在同一网络（WiFi/局域网）下，然后：

1. **打开浏览器**，访问：`http://你的IP:5173`
   - 例如：`http://192.168.1.100:5173`

2. **前端会自动检测**访问地址，并自动配置后端API地址

### 5. 防火墙设置

如果其他设备无法访问，可能需要配置防火墙：

**Windows:**
1. 打开 "Windows Defender 防火墙"
2. 点击 "高级设置"
3. 添加入站规则，允许端口 5173 和 3002

**Mac:**
1. 系统偏好设置 → 安全性与隐私 → 防火墙
2. 点击 "防火墙选项"
3. 允许 Node.js 和 Vite 通过防火墙

**Linux:**
```bash
# Ubuntu/Debian
sudo ufw allow 5173
sudo ufw allow 3002

# CentOS/RHEL
sudo firewall-cmd --add-port=5173/tcp --permanent
sudo firewall-cmd --add-port=3002/tcp --permanent
sudo firewall-cmd --reload
```

## 环境变量配置（可选）

如果需要手动指定后端API地址，可以通过环境变量 `VITE_API_BASE_URL` 设置（Vite 会读取 `VITE_` 前缀的系统环境变量）：

```env
VITE_API_BASE_URL=http://192.168.1.100:3002/api
```

## 生产环境配置

生产环境部署时，建议：

1. **后端 CORS 配置**：限制为特定域名
   ```typescript
   app.enableCors({
     origin: ['https://your-domain.com'],
     credentials: true,
   });
   ```

2. **前端 API 配置**：使用环境变量
   ```env
   VITE_API_BASE_URL=https://api.your-domain.com/api
   ```

## 故障排查

### 问题1：其他设备无法访问
- ✅ 检查防火墙设置
- ✅ 确认设备和服务器在同一网络
- ✅ 确认IP地址正确
- ✅ 检查后端和前端是否都已启动

### 问题2：API请求失败
- ✅ 检查后端CORS配置
- ✅ 确认后端API地址正确
- ✅ 检查浏览器控制台的网络请求

### 问题3：连接被拒绝
- ✅ 确认端口未被占用
- ✅ 检查防火墙规则
- ✅ 尝试更换端口

## 安全提示

⚠️ **开发环境配置允许所有来源访问，仅用于测试！**

生产环境部署时，请：
- 限制CORS为特定域名
- 使用HTTPS
- 配置适当的认证和授权
- 限制防火墙规则

