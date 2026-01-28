import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CompanyCultureHero, CompanyCultureMember, CompanyCultureAlbum } from './company-culture.entity';
import { CompanyCultureService } from './company-culture.service';
import { CompanyCultureController } from './company-culture.controller';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyCultureHero, CompanyCultureMember, CompanyCultureAlbum]),
    UsersModule,
    PermissionsModule,
    JwtModule.register(jwtConfig()),
  ],
  controllers: [CompanyCultureController],
  providers: [CompanyCultureService],
  exports: [CompanyCultureService],
})
export class CompanyCultureModule {}


