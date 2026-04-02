import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { MotivationsModule } from './modules/motivations/motivations.module';
import { MaterialApplicationsModule } from './modules/material-applications/material-applications.module';
import { PersonalDocsModule } from './modules/personal-docs/personal-docs.module';
import { MemosModule } from './modules/memos/memos.module';
import { databaseConfig } from './config/database.config';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { DailyWorksModule } from './modules/daily-works/daily-works.module';
import { CompanyFilesModule } from './modules/company-files/company-files.module';
import { SoftwareDownloadsModule } from './modules/software-downloads/software-downloads.module';
import { WorkspaceStorageModule } from './modules/workspace-storage/workspace-storage.module';
import { OnlineStatusModule } from './modules/online-status/online-status.module';
import { CompanyCultureModule } from './modules/company-culture/company-culture.module';
import { AiLinksModule } from './modules/ai-links/ai-links.module';
import { CrmModule } from './modules/crm/crm.module';
import { HrModule } from './modules/hr/hr.module';
import { ExcelImportModule } from './modules/excel-import/excel-import.module';
import { ImportHistoryModule } from './modules/import-history/import-history.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    // PermissionsModule 必须在 AuthModule 前面（AuthGuard 依赖 PermissionsService）
    PermissionsModule,
    AuthModule,
    UsersModule,
    FilesModule,
    EmployeesModule,
    RemindersModule,
    AnnouncementsModule,
    ExchangeRatesModule,
    MotivationsModule,
    MaterialApplicationsModule,
    PersonalDocsModule,
    MemosModule,
    DailyWorksModule,
    CompanyFilesModule,
    SoftwareDownloadsModule,
    WorkspaceStorageModule,
    OnlineStatusModule,
    CompanyCultureModule,
    AiLinksModule,
    ScheduleModule.forRoot(),
    CrmModule,
    HrModule,
    ExcelImportModule,
    ImportHistoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局守卫：所有 HTTP 请求都会先经过 AuthGuard 再经过 PermissionsGuard
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
