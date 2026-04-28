import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { PositionConfig } from './entities/position-config.entity';
import { DepartmentModule } from './entities/department-module.entity';
import { PositionPermission } from './entities/position-permission.entity';
import { DepartmentConfig } from './entities/department-config.entity';
import { UserExtraPermission } from './entities/user-extra-permission.entity';
import { PermissionsService } from './permissions.service';
import { PermissionEngineService } from './permission-engine.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { jwtConfig } from '../../config/jwt.config';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      RolePermission,
      UserRole,
      PositionConfig,
      DepartmentModule,
      PositionPermission,
      DepartmentConfig,
      UserExtraPermission,
    ]),
    JwtModule.register(jwtConfig()),
    forwardRef(() => UsersModule),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionEngineService, PermissionsGuard],
  exports: [PermissionsService, PermissionEngineService, PermissionsGuard],
})
export class PermissionsModule {}


