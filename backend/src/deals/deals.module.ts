import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DealLifecycleService } from './deal-lifecycle.service';
import { DealApprovalService } from './deal-approval.service';
import { DealsRepository } from './deals.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [DealsController],
  providers: [DealsService, DealLifecycleService, DealApprovalService, DealsRepository],
  exports: [DealsService, DealLifecycleService, DealApprovalService, DealsRepository],
})
export class DealsModule {}