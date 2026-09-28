import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { BlockchainEventService } from './event-listener/blockchain-event.service';
import { InvestmentHandler } from './event-listener/handlers/investment.handler';
import { EscrowHandler } from './event-listener/handlers/escrow.handler';
import { ProfitHandler } from './event-listener/handlers/profit.handler';
import { BlockchainReconciliationService } from './reconciliation/blockchain-reconciliation.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    BlockchainEventService,
    InvestmentHandler,
    EscrowHandler,
    ProfitHandler,
    BlockchainReconciliationService,
  ],
  exports: [
    BlockchainService,
    BlockchainEventService,
    BlockchainReconciliationService,
  ],
})
export class BlockchainModule {}
