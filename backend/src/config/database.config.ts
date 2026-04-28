import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const databaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDev = process.env.NODE_ENV === 'development';

  // ——————————————————————————————————————————
  // 判断是否使用 PostgreSQL（通过 DB_HOST 是否配置来判断）
  // 如果配置了 DB_HOST 则走 PostgreSQL，否则保持 SQLite 兼容（开发阶段平滑过渡）
  // ——————————————————————————————————————————
  const pgHost = process.env.DB_HOST;

  if (pgHost) {
    // ✅ PostgreSQL 模式
    return {
      type: 'postgres',
      host: pgHost,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'enbon_admin',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      // ✅ 生产必须关闭 synchronize，使用迁移脚本
      synchronize: isDev, // 开发环境开启便于快速迭代
      // ✅ 迁移脚本配置
      migrationsRun: isProduction,
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      logging: isDev,
      autoLoadEntities: true,
      // 连接池
      extra: {
        connectionLimit: 10,
        max: 20,
      },
    };
  }

  // 🔄 兼容模式（无 DB_HOST 时保持 SQLite）
  const dbPath = process.env.DB_DATABASE || process.env.DB_PATH || './data/enbon-admin.db';
  const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
  const fs = require('fs');
  if (!fs.existsSync(path.dirname(absoluteDbPath))) {
    fs.mkdirSync(path.dirname(absoluteDbPath), { recursive: true });
  }

  return {
    type: 'sqlite',
    database: absoluteDbPath,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction,
    logging: isDev,
    autoLoadEntities: true,
  };
};
