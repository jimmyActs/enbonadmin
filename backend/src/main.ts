import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import history from 'connect-history-api-fallback';
import { join } from 'path';

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
  
  // 设置全局前缀（API 保持 /api 开头）
  app.setGlobalPrefix('api');

  // 1) SPA history fallback：除了 /api 之外，其它路由都回退到前端 index.html
  // 某些 Nest 版本的 getInstance 不支持泛型，这里用类型断言兼容旧版本
  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  expressApp.use(
    history({
      rewrites: [
        {
          // 保留 /api 开头的请求给 Nest 接口处理
          from: /^\/api\/.*$/,
          to: (ctx) => ctx.parsedUrl.pathname || ctx.parsedUrl.path,
        },
      ],
    }),
  );

  // 2) 托管前端静态文件（Vite build 输出目录）
  // 使用 process.cwd() 保证永远指向项目根目录下的 frontend/dist
  const clientDist = join(process.cwd(), '..', 'frontend', 'dist');
  // console.log('Serving client from:', clientDist);
  expressApp.use(express.static(clientDist));
  
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
