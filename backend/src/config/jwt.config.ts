import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (): JwtModuleOptions => {
  return {
    secret: process.env.JWT_SECRET || 'enbon-admin-secret-key-change-in-production',
    signOptions: {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' as any,
    },
  };
};

