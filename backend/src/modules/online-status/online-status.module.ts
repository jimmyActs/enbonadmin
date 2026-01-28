import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { jwtConfig } from '../../config/jwt.config';
import { OnlineStatusService } from './online-status.service';
import { OnlineStatusController } from './online-status.controller';

@Module({
  imports: [
    UsersModule,
    JwtModule.register(jwtConfig()),
  ],
  controllers: [OnlineStatusController],
  providers: [OnlineStatusService],
  exports: [OnlineStatusService],
})
export class OnlineStatusModule {}


