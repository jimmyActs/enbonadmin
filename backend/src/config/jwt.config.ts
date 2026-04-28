import { JwtModuleOptions } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  // 尝试读取持久化的密钥文件（避免重启后 token 失效）
  const secretFile = path.join(process.cwd(), '.jwt-secret');
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf-8').trim();
  }

  // 生产环境必须配置环境变量
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
  }

  // 首次启动时生成并保存密钥
  const newSecret = crypto.randomBytes(64).toString('hex');
  fs.writeFileSync(secretFile, newSecret, 'utf-8');
  console.log('Generated and saved new JWT secret to .jwt-secret file');
  return newSecret;
}

export const jwtConfig = (): JwtModuleOptions => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return {
    secret: getJwtSecret(),
    signOptions: {
      expiresIn: expiresIn as any,
    },
  };
};

