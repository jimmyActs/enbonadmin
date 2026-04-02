import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmLead } from '../crm/entities/crm-lead.entity';
import { CrmInquirySource } from '../crm/entities/crm-inquiry-source.entity';
import { User } from '../users/entities/user.entity';
import { ExcelImportService } from './excel-import.service';
import { ExcelImportController } from './excel-import.controller';
import { ImportHistoryModule } from '../import-history/import-history.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmLead, CrmInquirySource, User]),
    ImportHistoryModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [ExcelImportController],
  providers: [ExcelImportService],
  exports: [ExcelImportService],
})
export class ExcelImportModule {}
