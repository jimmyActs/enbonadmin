import { Module } from '@nestjs/common'; // 导入模块装饰器
import { TypeOrmModule } from '@nestjs/typeorm'; // 导入 TypeORM 模块
import { DailyWork } from './entities/daily-work.entity'; // 导入 DailyWork 实体
import { DailyWorksService } from './daily-works.service'; // 导入服务
import { DailyWorksController } from './daily-works.controller'; // 导入控制器
import { UsersModule } from '../users/users.module'; // 导入用户模块，供控制器注入 UsersService
import { AuthModule } from '../auth/auth.module'; // 导入 Auth 模块，以便注入 JwtService

@Module({ // 声明 Nest 模块
  imports: [TypeOrmModule.forFeature([DailyWork]), UsersModule, AuthModule], // 注入 DailyWork 仓库、用户模块和 Auth 模块
  controllers: [DailyWorksController], // 注册控制器
  providers: [DailyWorksService], // 注册服务
})
export class DailyWorksModule {} // 导出模块类



