import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { DriveQuotaService } from './drive-quota.service';
import { ShareLink } from './entities/share-link.entity';
import { FolderPermission } from './entities/folder-permission.entity';
import { DriveName } from './entities/drive-name.entity';
import { UsersModule } from '../users/users.module';
import { jwtConfig } from '../../config/jwt.config';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareLink, FolderPermission, DriveName]),
    UsersModule,
    JwtModule.register(jwtConfig()),
    PermissionsModule,
  ],
  providers: [FilesService, DriveQuotaService],
  controllers: [FilesController],
  exports: [FilesService, DriveQuotaService],
})
export class FilesModule {}
