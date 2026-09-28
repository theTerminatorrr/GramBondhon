import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { InvestmentsRepository } from './investments.repository';

@Module({
  imports: [LedgerModule],
  providers: [InvestmentsService, InvestmentsRepository],
  controllers: [InvestmentsController],
  exports: [InvestmentsService, InvestmentsRepository],
})
export class InvestmentsModule {}