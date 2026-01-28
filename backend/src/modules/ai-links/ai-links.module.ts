import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AiLink } from './ai-link.entity';
import { AiLinksService } from './ai-links.service';
import { AiLinksController } from './ai-links.controller';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiLink]),
    UsersModule,
    PermissionsModule,
    JwtModule.register(jwtConfig()),
  ],
  controllers: [AiLinksController],
  providers: [AiLinksService],
  exports: [AiLinksService],
})
export class AiLinksModule {}


