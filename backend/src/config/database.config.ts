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
    // 为了简化内部系统的维护，这里默认开启自动同步（包括生产环境）。
    // 使用 SQLite 且只有单机部署时，TypeORM 的 synchronize 能自动创建新表（如 ai_links、company_culture 等），
    // 避免每次加实体都要手工执行迁移，否则会出现 500（表不存在）。
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: true,
  };
};

