import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const databaseConfig = (): TypeOrmModuleOptions => {
  // 使用绝对路径，确保数据库文件路径正确
  const dbPath = process.env.DB_DATABASE || process.env.DB_PATH || './data/enbon-admin.db';
  const absoluteDbPath = path.isAbsolute(dbPath) 
    ? dbPath 
    : path.resolve(process.cwd(), dbPath);
  
  // 确保数据库目录存在
  const dbDir = path.dirname(absoluteDbPath);
  const fs = require('fs');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return {
    type: 'sqlite',
    database: absoluteDbPath,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production', // 生产环境关闭自动同步
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: true,
  };
};

