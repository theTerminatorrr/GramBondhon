/**
 * GramBandhan - Investor Dashboard Controller
 * Manages the Investor Overview Dashboard tab, 4 square stat boxes,
 * live activity feed, and district field inspection status.
 */
import { InvestorProfileController } from './investor-profile';

export class InvestorDashboardController {
  constructor(private investorProfile?: InvestorProfileController) {}

  public open(): void {
    if (this.investorProfile) {
      this.investorProfile.openDashboard('dashboard');
    }
  }
}
