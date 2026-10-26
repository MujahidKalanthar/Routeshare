export interface SimulationAssumptions {
  // Unit economics
  netParcelRevenue: number; // Net of taxes (₹60 default)
  driverPayout: number; // ₹30 default
  incrementalOpsCost: number; // ₹12 default
  riderCredits: number; // ₹5 default
  driverRewards: number; // ₹4 default
  failureRatePct: number; // 2.5% default
  avgClaimCost: number; // ₹150 default

  // Demand & Ramp
  initialMonthlyDemand: number; // 150,000 default
  monthlyGrowthRatePct: number; // 12% default
  matchingSuccessRatePct: number; // 78% default
  driverOptInRatePct: number; // 72% default

  // Fleet & Platform
  activeFleetSize: number; // 25,000 drivers default
  flatFeeSubscriptionINR: number; // ₹2,000/mo default
  pilotDriverParticipationPct: number; // 40% default

  // Overheads & CapEx
  monthlyFixedOpsCostINR: number; // ₹25 Lakhs default
  capexInvestmentCrores: number; // ₹20 Crores default
}

export interface UnitEconomicsResult {
  netParcelRevenue: number;
  driverPayout: number;
  incrementalOpsCost: number;
  expectedFailureCost: number;
  contributionBeforeRewards: number; // ₹18 baseline before claims
  riderCredits: number;
  driverRewards: number;
  totalIncentives: number;
  netContributionPerParcel: number; // ₹9 baseline before claims
  contributionMarginPct: number;
  monthlyBreakEvenVolume: number;
}

export interface MonthlyRecord {
  month: string;
  monthNum: number;
  demandRequests: number;
  activeDrivers: number;
  completedParcels: number;
  revenueINR: number;
  driverPayoutsINR: number;
  incrementalOpsINR: number;
  riderCreditsINR: number;
  driverRewardsINR: number;
  failureClaimsINR: number;
  fixedCostINR: number;
  monthlyContributionINR: number;
  monthlyNetProfitINR: number;
  cumulativeContributionINR: number;
  cumulativeCashFlowINR: number;
  avgDriverIncrementalINR: number;
}

export interface ScenarioSummary {
  totalParcelsCompleted: number;
  totalRevenueINR: number;
  totalDriverEarningsINR: number;
  totalRiderCreditsINR: number;
  totalVariableContributionINR: number;
  totalFixedCostsINR: number;
  totalOperatingProfitINR: number;
  endingCashFlowINR: number;
  capexINR: number;
  recoveredIn12M: boolean;
  paybackMonth: number | null;
  capexRecoveryPct: number;
}

export interface SyntheticTrip {
  tripId: string;
  passenger: string;
  origin: string;
  destination: string;
  directDistanceKm: number;
  directEtaMin: number;
  maxPassengerDelayMin: number;
  driverId: string;
  driverName: string;
  vehicle: string;
  driverOptedIn: boolean;
}

export interface SyntheticParcel {
  parcelId: string;
  sender: string;
  pickup: string;
  dropoff: string;
  size: string;
  weightKg: number;
  deadlineMin: number;
  maxDetourAllowedKm: number;
  requiresVerification: boolean;
}

export interface RouteMatchEvaluation {
  status: 'MATCHED_SUCCESS' | 'REJECTED_DRIVER_OPT_OUT' | 'REJECTED_DETOUR_GUARDRAIL' | 'REJECTED_DEADLINE_VIOLATION';
  reason: string;
  detourKm: number;
  detourMin: number;
  passengerDelayMin: number;
  driverIncrementalEarning: number;
  riderCreditAwarded: number;
  guardrailPassed: boolean;
}
