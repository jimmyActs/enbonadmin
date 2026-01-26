import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialApplicationsController } from './material-applications.controller';
import { MaterialApplicationsService } from './material-applications.service';
import { MaterialApplication } from './material-application.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaterialApplication]),
    AuthModule,
    UsersModule,
  ],
  controllers: [MaterialApplicationsController],
  providers: [MaterialApplicationsService],
  exports: [MaterialApplicationsService],
})
export class MaterialApplicationsModule {}

