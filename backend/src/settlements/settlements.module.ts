import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { EscrowModule } from '../escrow/escrow.module';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';

@Module({
  imports: [LedgerModule, EscrowModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}