import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { MotivationsModule } from './modules/motivations/motivations.module'; // 导入励志语模块
import { MaterialApplicationsModule } from './modules/material-applications/material-applications.module'; // 导入物料申请模块
import { PersonalDocsModule } from './modules/personal-docs/personal-docs.module'; // 导入个人文档模块
import { MemosModule } from './modules/memos/memos.module'; // 导入备忘录模块
import { databaseConfig } from './config/database.config'; // 导入数据库配置
import { PermissionsModule } from './modules/permissions/permissions.module'; // 导入权限模块
import { DailyWorksModule } from './modules/daily-works/daily-works.module'; // 导入每日工作模块
import { CompanyFilesModule } from './modules/company-files/company-files.module'; // 导入公司文件配置模块
import { SoftwareDownloadsModule } from './modules/software-downloads/software-downloads.module'; // 导入软件下载元数据模块
import { WorkspaceStorageModule } from './modules/workspace-storage/workspace-storage.module';
import { OnlineStatusModule } from './modules/online-status/online-status.module';
import { CompanyCultureModule } from './modules/company-culture/company-culture.module';
import { AiLinksModule } from './modules/ai-links/ai-links.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 前端静态资源托管：将 build 后的 frontend/dist 通过 Nest 后端一起对外提供
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      // 保留 /api 开头的接口由 Nest 处理，而不是被静态文件抢占
      // 这里使用 ['/api', '/api/(.*)']，既兼容新版 path-to-regexp，又能排除所有 /api 路径
      exclude: ['/api', '/api/(.*)'],
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    AuthModule,
    UsersModule,
    FilesModule,
    EmployeesModule,
    RemindersModule,
    AnnouncementsModule,
    ExchangeRatesModule, // 汇率模块
    MotivationsModule, // 励志语模块
    PermissionsModule, // 权限模块
    MaterialApplicationsModule, // 物料申请模块
    PersonalDocsModule, // 个人文档模块
    MemosModule, // 备忘录模块
    DailyWorksModule, // 每日工作模块
    CompanyFilesModule, // 公司文件分类/系列配置模块
    SoftwareDownloadsModule, // 软件下载元数据模块
    WorkspaceStorageModule,
    OnlineStatusModule,
    CompanyCultureModule,
    AiLinksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
