import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MotivationsController } from './motivations.controller';
import { MotivationsService } from './motivations.service';
import { Motivation, BannerImage } from './motivation.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { WorkspaceStorageModule } from '../workspace-storage/workspace-storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Motivation, BannerImage]),
    AuthModule,
    UsersModule,
    PermissionsModule,
    WorkspaceStorageModule,
  ],
  controllers: [MotivationsController],
  providers: [MotivationsService],
  exports: [MotivationsService],
})
export class MotivationsModule {}

