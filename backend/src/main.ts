import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';
  const isDev = process.env.NODE_ENV === 'development';

  // 安全响应头
  app.use(helmet());

  // 全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS 配置
  const allowedOrigins = isProduction
    ? (process.env.ALLOWED_ORIGINS?.split(',') || [])
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ];

  if (isProduction && allowedOrigins.length === 0) {
    console.warn('⚠️ WARNING: CORS origins not configured for production!');
  }

  app.enableCors({
    origin: isDev ? true : (allowedOrigins.length > 0 ? allowedOrigins : false),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: isProduction ? ['Content-Range', 'X-Content-Range'] : [],
    maxAge: isProduction ? 600 : 86400,
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
  
  // 设置全局前缀（API 保持 /api 开头）
  app.setGlobalPrefix('api');

  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  
  // SPA history fallback 中间件：替代 connect-history-api-fallback
  const clientDist = join(process.cwd(), '..', 'frontend', 'dist');
  const indexPath = join(clientDist, 'index.html');
  
  expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    // API 请求直接通过
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // 检查请求的文件是否存在
    const filePath = join(clientDist, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return next();
    }
    
    // 对于非API请求，返回 index.html（支持 SPA 路由）
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    
    next();
  });

  // 托管前端静态文件
  expressApp.use(express.static(clientDist));
  
  const port = process.env.PORT || 3002;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  
  // 获取本机IP地址
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
