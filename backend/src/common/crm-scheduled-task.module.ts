import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CrmSalesTarget } from '../modules/crm/entities/crm-sales-target.entity';
import { CrmCustomer } from '../modules/crm/crm-customer.entity';
import { CrmLead } from '../modules/crm/entities/crm-lead.entity';
import { CrmScheduledTaskService } from './crm-scheduled-task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmSalesTarget, CrmCustomer, CrmLead]),
    ScheduleModule,
  ],
  providers: [CrmScheduledTaskService],
  exports: [CrmScheduledTaskService],
})
export class CrmScheduledTaskModule {}
