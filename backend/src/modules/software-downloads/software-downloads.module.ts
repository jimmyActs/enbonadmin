import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SoftwareMetadata } from './entities/software-metadata.entity';
import { SoftwareDownloadsService } from './software-downloads.service';
import { SoftwareDownloadsController } from './software-downloads.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([SoftwareMetadata]),
    PermissionsModule,
    JwtModule.register(jwtConfig()),
  ],
  controllers: [SoftwareDownloadsController],
  providers: [SoftwareDownloadsService],
  exports: [SoftwareDownloadsService],
})
export class SoftwareDownloadsModule {}


