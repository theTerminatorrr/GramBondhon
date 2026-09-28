/**
 * GramBandhan - Investor Marketplace Controller
 * Manages the Investor Dashboard Marketplace tab, rural craft investments,
 * artisan collective partnerships, and bulk village order contracts.
 */
import { MarketplaceController } from './marketplace';
import { InvestorProfileController } from './investor-profile';

export class InvestorMarketplaceController {
  constructor(
    private investorProfile?: InvestorProfileController,
    private marketplace?: MarketplaceController
  ) {}

  public open(): void {
    if (this.investorProfile) {
      this.investorProfile.openDashboard('marketplace');
    }
  }

  public getMarketplace(): MarketplaceController | undefined {
    return this.marketplace;
  }
}
