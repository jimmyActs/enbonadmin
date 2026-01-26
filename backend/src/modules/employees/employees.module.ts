import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { jwtConfig } from '../../config/jwt.config';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    JwtModule.register(jwtConfig()),
    PermissionsModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}

