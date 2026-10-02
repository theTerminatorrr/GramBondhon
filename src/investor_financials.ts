/**
 * GramBandhan - Investor Financials & Portfolio Controller
 * Manages the Investor Financials tab, Capital Outflow & Return Inflow Ledger,
 * dividend calendar, and Shariah reconciliation audit certificates.
 */
import { InvestorProfileController } from './investor-profile';

export class InvestorFinancialsController {
  constructor(private investorProfile?: InvestorProfileController) {}

  public open(): void {
    if (this.investorProfile) {
      this.investorProfile.openDashboard('financials');
    }
  }
}
