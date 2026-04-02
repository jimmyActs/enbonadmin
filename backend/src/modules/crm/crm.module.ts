import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmCustomer } from './crm-customer.entity';
import { CrmLead } from './entities/crm-lead.entity';
import { CrmEmail } from './entities/crm-email.entity';
import { CrmSalesTarget } from './entities/crm-sales-target.entity';
import { CrmShipmentFile } from './entities/crm-shipment-file.entity';
import { CrmInquirySource } from './entities/crm-inquiry-source.entity';
import { CrmQuotation } from './entities/crm-quotation.entity';
import { CrmReview } from './entities/crm-review.entity';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { CrmQuotationService } from './crm-quotation.service';
import { CrmSalesTargetService } from './crm-sales-target.service';
import { CrmReviewService } from './crm-review.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { CrmScheduledTaskModule } from '../../common/crm-scheduled-task.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrmCustomer,
      CrmLead,
      CrmEmail,
      CrmSalesTarget,
      CrmShipmentFile,
      CrmInquirySource,
      CrmQuotation,
      CrmReview,
    ]),
    UsersModule,
    AuthModule,
    CrmScheduledTaskModule,
    PermissionsModule,
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmQuotationService, CrmSalesTargetService, CrmReviewService],
})
export class CrmModule {}
