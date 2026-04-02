import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    UsersModule,
    PermissionsModule,
    JwtModule.register(jwtConfig()),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
