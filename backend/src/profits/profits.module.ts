import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { ProfitsService } from './profits.service';
import { ProfitsController } from './profits.controller';

@Module({
  imports: [LedgerModule],
  controllers: [ProfitsController],
  providers: [ProfitsService],
  exports: [ProfitsService],
})
export class ProfitsModule {}