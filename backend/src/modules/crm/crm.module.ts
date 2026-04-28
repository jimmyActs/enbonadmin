import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmCustomer } from './crm-customer.entity';
import { CrmLead } from './entities/crm-lead.entity';
import { CrmEmail } from './entities/crm-email.entity';
import { CrmSalesTarget } from './entities/crm-sales-target.entity';
import { CrmShipmentFile } from './entities/crm-shipment-file.entity';
import { CrmInquirySource } from './entities/crm-inquiry-source.entity';
import { CrmQuotation } from './entities/crm-quotation.entity';
import { CrmQuotationTrack } from './entities/crm-quotation-track.entity';
import { CrmQuotationVersion } from './entities/crm-quotation-version.entity';
import { CrmLostReason } from './entities/crm-lost-reason.entity';
import { CrmReview } from './entities/crm-review.entity';
import { CrmCustomerChangelog } from './entities/crm-customer-changelog.entity';
import { CrmService } from './crm.service';
import { CrmScheduledTaskService } from './crm-scheduled-task.service';
import { CrmController } from './crm.controller';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { CrmQuotationService } from './crm-quotation.service';
import { CrmSalesTargetService } from './crm-sales-target.service';
import { CrmReviewService } from './crm-review.service';
import { CrmCustomerChangelogService } from './crm-customer-changelog.service';
import { EmailSyncService } from './email-sync.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
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
      CrmQuotationTrack,
      CrmQuotationVersion,
      CrmLostReason,
      CrmReview,
      CrmCustomerChangelog,
    ]),
    UsersModule,
    AuthModule,
    PermissionsModule,
  ],
  controllers: [CrmController, WebhookController],
  providers: [CrmService, CrmScheduledTaskService, CrmQuotationService, CrmSalesTargetService, CrmReviewService, WebhookService, EmailSyncService, CrmCustomerChangelogService],
  exports: [CrmService, CrmScheduledTaskService, CrmQuotationService, CrmCustomerChangelogService],
})
export class CrmModule {}
