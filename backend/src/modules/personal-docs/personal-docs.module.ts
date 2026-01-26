import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalDocsService } from './personal-docs.service';
import { PersonalDocsController } from './personal-docs.controller';
import { PersonalDocument } from './entities/personal-document.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [TypeOrmModule.forFeature([PersonalDocument]), JwtModule.register(jwtConfig())],
  controllers: [PersonalDocsController],
  providers: [PersonalDocsService],
})
export class PersonalDocsModule {}


