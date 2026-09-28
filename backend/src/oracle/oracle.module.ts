import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { DatabaseModule } from '../database/database.module';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controller';
import { HarvestVerificationService } from './harvest-verification.service';
import { RevenueVerificationService } from './revenue-verification.service';
import { ExpenseVerificationService } from './expense-verification.service';

@Module({
  imports: [BlockchainModule, DatabaseModule],
  controllers: [OracleController],
  providers: [
    OracleService,
    HarvestVerificationService,
    RevenueVerificationService,
    ExpenseVerificationService,
  ],
  exports: [
    OracleService,
    HarvestVerificationService,
    RevenueVerificationService,
    ExpenseVerificationService,
  ],
})
export class OracleModule {}