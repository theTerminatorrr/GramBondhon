import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { DealsModule } from '../deals/deals.module';
import { EscrowModule } from '../escrow/escrow.module';
import { FarmersModule } from '../farmers/farmers.module';
import { InvestmentsModule } from '../investments/investments.module';
import { InvestorsModule } from '../investors/investors.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProjectsModule } from '../projects/projects.module';
import { SettlementsModule } from '../settlements/settlements.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { FarmerAdminController } from './controllers/farmer-admin.controller';
import { DealAdminController } from './controllers/deal-admin.controller';
import { FinanceAdminController } from './controllers/finance-admin.controller';
import { RiskAdminController } from './controllers/risk-admin.controller';
import { InvestmentAdminController } from './controllers/investment-admin.controller';
import { AdminBaseService } from './admin-base.service';
import { FarmerVerificationService } from './farmer-verification.service';
import { ProjectVerificationService } from './project-verification.service';
import { DealApprovalService } from './deal-approval.service';
import { InvestmentMonitoringService } from './investment-monitoring.service';
import { WithdrawalReviewService } from './withdrawal-review.service';
import { RiskService } from './risk.service';
import { FinancialReportService } from './financial-report.service';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [
    BlockchainModule,
    FarmersModule,
    InvestorsModule,
    ProjectsModule,
    DealsModule,
    InvestmentsModule,
    PaymentsModule,
    LedgerModule,
    SettlementsModule,
    EscrowModule,
  ],
  controllers: [
    AdminController,
    FarmerAdminController,
    DealAdminController,
    FinanceAdminController,
    RiskAdminController,
    InvestmentAdminController,
  ],
  providers: [
    AdminService,
    AdminBaseService,
    FarmerVerificationService,
    ProjectVerificationService,
    DealApprovalService,
    InvestmentMonitoringService,
    WithdrawalReviewService,
    RiskService,
    FinancialReportService,
    ReconciliationService,
  ],
  exports: [
    AdminService,
    AdminBaseService,
    FarmerVerificationService,
    ProjectVerificationService,
    DealApprovalService,
    InvestmentMonitoringService,
    WithdrawalReviewService,
    RiskService,
    FinancialReportService,
    ReconciliationService,
  ],
})
export class AdminModule {}