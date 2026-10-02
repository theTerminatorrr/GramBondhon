/**
 * GRAMBANDHAN (গ্রামীণ বন্ধন) - Core Type Definitions
 * Designed for clean maintainability and easy explanation for teachers & evaluators.
 */

export type ProjectCategory = 'all' | 'agriculture' | 'livestock' | 'handicrafts' | 'agro' | 'fisheries' | 'crops' | 'short_term' | 'long_term';

export interface Project {
  id: string;
  name: string;
  bengaliName: string;
  category: 'agriculture' | 'livestock' | 'handicrafts' | 'agro' | 'fisheries' | 'crops';
  location: string;
  district: string;
  image: string;
  badge: string;
  verified: boolean;
  fundingRaisedBDT: number;
  fundingGoalBDT: number;
  minInvestmentBDT: number;
  potentialReturn: string;
  returnRangePercent: [number, number]; // e.g. [13.5, 16.0]
  duration: string;
  durationMonths: number;
  riskLevel: 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High';
  producerName: string;
  producerRole: string;
  cooperativeInfo: string;
  shortStory: string;
  fullDescription: string;
  profitSharingRatio: string;
  bengaliReturn?: string;
  investorShareText?: string;
  bengaliProfitSplit?: string;
  totalReturnBDT?: string;
  periodText?: string;
  returnTypeTag?: string;
  terms: string[];
  verificationChecklist: string[];
  isFeatured?: boolean;
}

export interface Product {
  id: string;
  name: string;
  bengaliName: string;
  category: 'farming' | 'handicrafts' | 'dairy' | 'fisheries' | 'spices' | 'fruits' | 'nakshi-kantha' | 'jute' | 'bamboo' | 'agro-fresh' | string;
  priceBDT: number;
  originalPriceBDT?: number;
  discountPercent?: number;
  unit?: string;
  image: string;
  artisanName: string;
  artisanDistrict: string;
  craftType: string;
  description: string;
  rating: number;
  reviewsCount: number;
  flashDeal?: boolean;
  sellerCooperative?: string;
  originVillage?: string;
  inStock?: boolean;
  deliveryDays?: string;
}

export interface Artisan {
  id: string;
  name: string;
  bengaliName: string;
  craft: string;
  village: string;
  district: string;
  image: string;
  bio: string;
  specialty: string;
  projectsCompleted: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  district: string;
  quote: string;
  rating: number;
  type: 'investor' | 'farmer' | 'artisan';
  avatarBg: string;
  avatarInitials: string;
}

export type UserRole = 'farmer' | 'investor' | 'buyer';

export interface UnifiedUser {
  name: string;
  email: string;
  phone: string;
  roles: UserRole[];
  nidVerified: boolean;
  portfolioValueBDT: number;
  address?: string;
  city?: string;
  district?: string;
  memberSince?: string;
}

export interface InvestorUser {
  name: string;
  email: string;
  phone: string;
  nidVerified: boolean;
  portfolioValueBDT: number;
  roles?: UserRole[];
}

export interface BuyerUser {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  preferredPayment: 'bKash' | 'Nagad' | 'Cash on Delivery';
  memberSince: string;
}

export interface TrackingStep {
  label: string;
  bengaliLabel: string;
  time: string;
  completed: boolean;
  active?: boolean;
}

export interface BuyerOrder {
  id: string;
  date: string;
  status: 'on_the_way' | 'delivered' | 'cancelled';
  statusBengali: string;
  statusBadgeClass: string;
  items: { product: Product; quantity: number }[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash on Delivery';
  paymentDetails?: string;
  shippingAddress: string;
  recipientPhone: string;
  trackingNumber?: string;
  courierPartner?: string;
  estimatedDelivery?: string;
  trackingSteps?: TrackingStep[];
  cancelReason?: string;
  refundStatus?: string;
}

export type InvestorProjectStatus = 'recent' | 'ongoing' | 'completed';

export interface InvestorPortfolioProject {
  id: string;
  name: string;
  bengaliName: string;
  category: string;
  district: string;
  upazila?: string;
  investedAmountBDT: number;
  expectedProfitBDT: number;
  actualReturnBDT?: number;
  status: InvestorProjectStatus;
  statusLabel: string;
  statusDescription: string;
  startDate?: string;
  expectedEndDate?: string;
  completionDate?: string;
  payoutReceivedDate?: string;
  image: string;
  progressPercent: number;
  roiPercentage: number;
  farmerName: string;
  contractType: string;
  // Funding Collection Phase fields
  fundingRaisedBDT?: number;
  fundingGoalBDT?: number;
  fundingPercent?: number;
  daysLeftToClose?: number;
  // Ongoing Field Progress Tracking fields
  fieldStage?: string;
  fieldInspector?: string;
  soilCondition?: string;
  weatherStatus?: string;
  lastAuditDate?: string;
  progressMilestones?: { label: string; date: string; completed: boolean; active?: boolean }[];
  // Completed Project Money Send & Receive Audit fields
  moneySentDate?: string;
  moneySentChannel?: string;
  moneySentTrxId?: string;
  fieldDisbursementDate?: string;
  mandiSettlementDate?: string;
  moneyReceivedDate?: string;
  moneyReceivedChannel?: string;
  moneyReceivedTrxId?: string;
  moneyReceivedAccount?: string;
  harvestWeightKg?: number;
  mandiRatePerKg?: number;
}

export interface InvestorActivityItem {
  id: string;
  description: string;
  division: string;
  status: 'LIVE' | 'COMPLETED' | 'IN REVIEW';
  timestamp: string;
}

export interface InvestorDashboardStats {
  totalAccountBalanceBDT: number;
  totalProfitBDT: number;
  totalInvestmentBDT: number;
  annualInvestmentBDT: number;
  annualProfitBDT: number;
  savingsAndInsurancePoolBDT: number;
  savingsBDT: number;
  insuranceBDT: number;
  recentProjectsCount: number; // Invested, not started yet
  ongoingProjectsCount: number; // Invested, deploying on field
  completedProjectsCount: number; // Finished & received money
  marketplaceSalesBDT: number;
  aiRiskFlaggingCount: number;
  lastSynced: string;
  systemUptime: string;
}

