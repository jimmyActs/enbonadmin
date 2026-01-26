import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { Reminder } from './entities/reminder.entity';
import { UsersModule } from '../users/users.module';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reminder]),
    UsersModule,
    JwtModule.register(jwtConfig()),
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}

