import { Module } from '@nestjs/common'; // 导入模块装饰器
import { TypeOrmModule } from '@nestjs/typeorm'; // 导入 TypeORM 模块
import { Memo } from './entities/memo.entity'; // 导入 Memo 实体
import { MemosService } from './memos.service'; // 导入服务
import { MemosController } from './memos.controller'; // 导入控制器
import { UsersModule } from '../users/users.module'; // 导入用户模块，供控制器注入 UsersService
import { AuthModule } from '../auth/auth.module'; // 导入 Auth 模块，以便在控制器中注入 JwtService

@Module({ // 声明 Nest 模块
  imports: [TypeOrmModule.forFeature([Memo]), UsersModule, AuthModule], // 注入 Memo 仓库、UsersModule 和 AuthModule（提供 JwtService）
  controllers: [MemosController], // 注册控制器
  providers: [MemosService], // 注册服务
})
export class MemosModule {} // 导出模块类


