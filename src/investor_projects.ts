/**
 * GramBandhan - Investor Projects Controller
 * Manages the Investor Dashboard Projects tab, 30 verified projects,
 * bilingual Mudarabah return indicators, and the Investment Return Calculator.
 */
import { InvestorProfileController } from './investor-profile';
import { ActiveProjectsController } from './active-projects';

export class InvestorProjectsController {
  constructor(
    private investorProfile?: InvestorProfileController,
    private projects?: ActiveProjectsController
  ) {}

  public open(): void {
    if (this.investorProfile) {
      this.investorProfile.openDashboard('projects');
    }
  }

  public getProjects(): ActiveProjectsController | undefined {
    return this.projects;
  }
}
