import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { LedgerModule } from './ledger/ledger.module';
import { InvestmentsModule } from './investments/investments.module';
import { PaymentsModule } from './payments/payments.module';
import { EscrowModule } from './escrow/escrow.module';
import { SettlementsModule } from './settlements/settlements.module';
import { ProfitsModule } from './profits/profits.module';
import { AdminModule } from './admin/admin.module';
import { OracleModule } from './oracle/oracle.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { WalletsModule } from './wallets/wallets.module';
import { DealsModule } from './deals/deals.module';
import { FarmsModule } from './farms/farms.module';
import { ProjectsModule } from './projects/projects.module';
import { FarmersModule } from './farmers/farmers.module';
import { InvestorsModule } from './investors/investors.module';
import { CropsModule } from './crops/crops.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      cache: true,
      expandVariables: true,
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    LedgerModule,
    InvestmentsModule,
    PaymentsModule,
    EscrowModule,
    SettlementsModule,
    ProfitsModule,
    OracleModule,
    NotificationsModule,
    AuditModule,
    WalletsModule,
    FarmersModule,
    FarmsModule,
    ProjectsModule,
    CropsModule,
    DealsModule,
    InvestorsModule,
    BlockchainModule,
    DashboardModule,
    AdminModule,
    WebhooksModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply any global middleware here if needed in the future
  }
}