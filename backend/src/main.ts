import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用CORS - 允许所有来源（开发环境）
  // 生产环境应该限制为特定域名
  app.enableCors({
    origin: true, // 允许所有来源（开发环境）
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 默认端口改为 3002，避免与其它本地项目（如 enbon-ai 前端 3000）冲突
  const port = process.env.PORT || 3002;
  const host = process.env.HOST || '0.0.0.0'; // 允许外部访问
  await app.listen(port, host);
  
  // 获取本机IP地址（用于显示访问地址）
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const interfaceName of Object.keys(networkInterfaces)) {
    for (const iface of networkInterfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log(`🚀 Backend server running on:`);
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Network: http://${localIP}:${port}`);
}
bootstrap();
