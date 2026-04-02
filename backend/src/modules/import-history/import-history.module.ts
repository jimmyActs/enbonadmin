import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportHistory } from './import-history.entity';
import { ImportHistoryService } from './import-history.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ImportHistory]), UsersModule],
  providers: [ImportHistoryService],
  exports: [ImportHistoryService],
})
export class ImportHistoryModule {}
