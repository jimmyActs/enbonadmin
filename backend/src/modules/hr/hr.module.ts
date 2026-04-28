import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { HrLeaveRequest } from './entities/hr-leave-request.entity';
import { HrAttendance } from './entities/hr-attendance.entity';
import { HrPerformance } from './entities/hr-performance.entity';
import { HrPerformanceCycle } from './entities/hr-performance-cycle.entity';
import { HrPerformanceIndicator } from './entities/hr-performance-indicator.entity';
import { HrPerformanceTemplate } from './entities/hr-performance-template.entity';
import { HrTemplateIndicator } from './entities/hr-template-indicator.entity';
import { HrPerformanceReview } from './entities/hr-performance-review.entity';
import { HrPip } from './entities/hr-pip.entity';
import { HrPipStep } from './entities/hr-pip-step.entity';
import { HrEmployeeExit } from './entities/hr-employee-exit.entity';
import { HrProbation } from './entities/hr-probation.entity';
import { HrProbationEvaluation } from './entities/hr-probation-evaluation.entity';
import { HrPayrollBudget } from './entities/hr-payroll-budget.entity';
import { HrPayrollAlert } from './entities/hr-payroll-alert.entity';
import { HrTrainingCourse } from './entities/hr-training-course.entity';
import { HrTrainingPlan } from './entities/hr-training-plan.entity';
import { HrTrainingPlanCourse } from './entities/hr-training-plan-course.entity';
import { HrTrainingRecord } from './entities/hr-training-record.entity';
import { HrTrainingEvaluation } from './entities/hr-training-evaluation.entity';
import { HrRecruitmentDemand, HrCandidate } from './entities/hr-recruitment.entity';
import { HrPayroll, HrPayrollStructure } from './entities/hr-payroll.entity';
import { HrEvent } from './entities/hr-event.entity';
import { User } from '../users/entities/user.entity';
import { HrService } from './hr.service';
import { HrPerformanceService, HrExitService, HrProbationService, HrPayrollBudgetService, HrTrainingService } from './hr-performance.service';
import { HrController } from './hr.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ExcelImportModule } from '../excel-import/excel-import.module';
import { ImportHistoryModule } from '../import-history/import-history.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: async (req, file, cb) => {
          const basePath = process.env.STORAGE_PATH || './storage';
          const trainingPath = path.join(basePath, 'training');
          try {
            await fs.promises.mkdir(trainingPath, { recursive: true });
          } catch (err) {
            console.error('创建培训目录失败:', err);
          }
          cb(null, trainingPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const filename = `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('只支持视频文件'), false);
        }
      },
    }),
    TypeOrmModule.forFeature([
      HrLeaveRequest,
      HrAttendance,
      HrPerformance,
      HrPerformanceCycle,
      HrPerformanceIndicator,
      HrPerformanceTemplate,
      HrTemplateIndicator,
      HrPerformanceReview,
      HrPip,
      HrPipStep,
      HrEmployeeExit,
      HrProbation,
      HrProbationEvaluation,
      HrPayrollBudget,
      HrPayrollAlert,
      HrTrainingCourse,
      HrTrainingPlan,
      HrTrainingPlanCourse,
      HrTrainingRecord,
      HrTrainingEvaluation,
      HrRecruitmentDemand,
      HrCandidate,
      HrPayroll,
      HrPayrollStructure,
      HrEvent,
      User,
    ]),
    UsersModule,
    AuthModule,
    ExcelImportModule,
    ImportHistoryModule,
    PermissionsModule,
    RemindersModule,
  ],
  controllers: [HrController],
  providers: [HrService, HrPerformanceService, HrExitService, HrProbationService, HrPayrollBudgetService, HrTrainingService],
  exports: [HrService, HrPerformanceService, HrExitService, HrProbationService, HrPayrollBudgetService, HrTrainingService],
})
export class HrModule {}
