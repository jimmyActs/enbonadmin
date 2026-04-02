import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrAttendance } from './entities/hr-attendance.entity';
import { HrPerformance, HrPerformanceTemplate } from './entities/hr-performance.entity';
import { HrRecruitmentDemand, HrCandidate } from './entities/hr-recruitment.entity';
import { HrPayroll, HrPayrollStructure } from './entities/hr-payroll.entity';
import { HrEvent } from './entities/hr-event.entity';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ExcelImportModule } from '../excel-import/excel-import.module';
import { ImportHistoryModule } from '../import-history/import-history.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HrAttendance,
      HrPerformance,
      HrPerformanceTemplate,
      HrRecruitmentDemand,
      HrCandidate,
      HrPayroll,
      HrPayrollStructure,
      HrEvent,
    ]),
    UsersModule,
    AuthModule,
    ExcelImportModule,
    ImportHistoryModule,
    PermissionsModule,
  ],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
