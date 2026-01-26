import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CompanyFileCategory } from './entities/company-file-category.entity';
import { CompanyFileSeries } from './entities/company-file-series.entity';
import { CompanyFilesService } from './company-files.service';
import { CompanyFilesController } from './company-files.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyFileCategory, CompanyFileSeries]),
    PermissionsModule,
    JwtModule.register(jwtConfig()),
  ],
  controllers: [CompanyFilesController],
  providers: [CompanyFilesService],
  exports: [CompanyFilesService],
})
export class CompanyFilesModule implements OnModuleInit {
  constructor(private readonly service: CompanyFilesService) {}

  async onModuleInit() {
    await this.service.ensureDefaultCategories();
  }
}


