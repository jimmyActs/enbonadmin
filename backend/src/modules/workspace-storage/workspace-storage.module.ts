import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { WorkspaceStorageConfig } from './workspace-storage-config.entity';
import { WorkspaceStorageService } from './workspace-storage.service';
import { WorkspaceStorageController } from './workspace-storage.controller';
import { jwtConfig } from '../../config/jwt.config';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceStorageConfig]),
    JwtModule.register(jwtConfig()),
    PermissionsModule,
  ],
  providers: [WorkspaceStorageService],
  controllers: [WorkspaceStorageController],
  exports: [WorkspaceStorageService],
})
export class WorkspaceStorageModule {}


