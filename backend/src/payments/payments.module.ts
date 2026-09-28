import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { InvestmentsModule } from '../investments/investments.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MockPaymentProvider } from './payment-providers/mock-payment.provider';
import { PAYMENT_PROVIDERS } from './payment-providers.constants';

@Module({
  imports: [LedgerModule, InvestmentsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockPaymentProvider,
    {
      provide: PAYMENT_PROVIDERS,
      useFactory: (mockProvider: MockPaymentProvider) => ({
        [mockProvider.name]: mockProvider,
      }),
      inject: [MockPaymentProvider],
    },
  ],
  exports: [PaymentsService, PAYMENT_PROVIDERS, MockPaymentProvider],
})
export class PaymentsModule {}