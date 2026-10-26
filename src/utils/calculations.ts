import {
  SimulationAssumptions,
  UnitEconomicsResult,
  MonthlyRecord,
  ScenarioSummary,
  SyntheticTrip,
  SyntheticParcel,
  RouteMatchEvaluation,
} from '../types';

export function calculateUnitEconomics(assumptions: SimulationAssumptions): UnitEconomicsResult {
  // Expected failure/claims costs
  const expectedFailureCost = (assumptions.failureRatePct / 100) * assumptions.avgClaimCost;

  // Baseline from report: Net revenue (₹60) - Driver Payout (₹30) - Ops (₹12) = ₹18 before rewards
  const contributionBeforeRewards =
    assumptions.netParcelRevenue - assumptions.driverPayout - assumptions.incrementalOpsCost - expectedFailureCost;

  const totalIncentives = assumptions.riderCredits + assumptions.driverRewards;
  const netContributionPerParcel = contributionBeforeRewards - totalIncentives;

  const contributionMarginPct =
    assumptions.netParcelRevenue > 0 ? (netContributionPerParcel / assumptions.netParcelRevenue) * 100 : 0;

  const monthlyBreakEvenVolume =
    netContributionPerParcel > 0
      ? Math.ceil(assumptions.monthlyFixedOpsCostINR / netContributionPerParcel)
      : Infinity;

  return {
    netParcelRevenue: assumptions.netParcelRevenue,
    driverPayout: assumptions.driverPayout,
    incrementalOpsCost: assumptions.incrementalOpsCost,
    expectedFailureCost,
    contributionBeforeRewards,
    riderCredits: assumptions.riderCredits,
    driverRewards: assumptions.driverRewards,
    totalIncentives,
    netContributionPerParcel,
    contributionMarginPct,
    monthlyBreakEvenVolume,
  };
}

export function simulate12MonthPilot(assumptions: SimulationAssumptions): MonthlyRecord[] {
  const unitEcon = calculateUnitEconomics(assumptions);
  const records: MonthlyRecord[] = [];
  const capexINR = assumptions.capexInvestmentCrores * 10000000;

  let currentDemand = assumptions.initialMonthlyDemand;
  const growthRate = assumptions.monthlyGrowthRatePct / 100;
  const matchRate = (assumptions.matchingSuccessRatePct / 100) * (assumptions.driverOptInRatePct / 100);

  const targetParticipatingDrivers =
    assumptions.activeFleetSize * (assumptions.pilotDriverParticipationPct / 100);

  let cumulativeContribution = 0;
  let cumulativeCashFlow = -capexINR;

  for (let month = 1; month <= 12; month++) {
    // Driver participation ramp-up
    const rampFactor = Math.min(1.0, 0.45 + (month - 1) * 0.1);
    const activeDrivers = Math.floor(targetParticipatingDrivers * rampFactor);
    const driverCapacity = activeDrivers * 75; // average max capacity 2.5 parcels/day

    const potentialMatched = Math.floor(currentDemand * matchRate);
    const completedParcels = Math.min(potentialMatched, driverCapacity);

    // Financial calculations
    const revenueINR = completedParcels * assumptions.netParcelRevenue;
    const driverPayoutsINR = completedParcels * assumptions.driverPayout;
    const incrementalOpsINR = completedParcels * assumptions.incrementalOpsCost;
    const riderCreditsINR = completedParcels * assumptions.riderCredits;
    const driverRewardsINR = completedParcels * assumptions.driverRewards;
    const failureClaimsINR = completedParcels * unitEcon.expectedFailureCost;

    const monthlyContributionINR = completedParcels * unitEcon.netContributionPerParcel;
    const fixedCostINR = assumptions.monthlyFixedOpsCostINR;
    const monthlyNetProfitINR = monthlyContributionINR - fixedCostINR;

    cumulativeContribution += monthlyContributionINR;
    cumulativeCashFlow += monthlyNetProfitINR;

    const avgDriverIncrementalINR = activeDrivers > 0 ? (driverPayoutsINR + driverRewardsINR) / activeDrivers : 0;

    records.push({
      month: `M${month.toString().padStart(2, '0')}`,
      monthNum: month,
      demandRequests: Math.round(currentDemand),
      activeDrivers,
      completedParcels,
      revenueINR,
      driverPayoutsINR,
      incrementalOpsINR,
      riderCreditsINR,
      driverRewardsINR,
      failureClaimsINR,
      fixedCostINR,
      monthlyContributionINR,
      monthlyNetProfitINR,
      cumulativeContributionINR: cumulativeContribution,
      cumulativeCashFlowINR: cumulativeCashFlow,
      avgDriverIncrementalINR,
    });

    currentDemand *= 1.0 + growthRate;
  }

  return records;
}

export function calculateScenarioSummary(
  records: MonthlyRecord[],
  assumptions: SimulationAssumptions
): ScenarioSummary {
  const capexINR = assumptions.capexInvestmentCrores * 10000000;
  const totalParcelsCompleted = records.reduce((acc, r) => acc + r.completedParcels, 0);
  const totalRevenueINR = records.reduce((acc, r) => acc + r.revenueINR, 0);
  const totalDriverEarningsINR = records.reduce((acc, r) => acc + r.driverPayoutsINR + r.driverRewardsINR, 0);
  const totalRiderCreditsINR = records.reduce((acc, r) => acc + r.riderCreditsINR, 0);
  const totalVariableContributionINR = records.reduce((acc, r) => acc + r.monthlyContributionINR, 0);
  const totalFixedCostsINR = records.reduce((acc, r) => acc + r.fixedCostINR, 0);
  const totalOperatingProfitINR = records.reduce((acc, r) => acc + r.monthlyNetProfitINR, 0);
  const endingCashFlowINR = records[records.length - 1]?.cumulativeCashFlowINR ?? -capexINR;

  let paybackMonth: number | null = null;
  let recoveredIn12M = false;

  for (const r of records) {
    if (r.cumulativeCashFlowINR >= 0) {
      paybackMonth = r.monthNum;
      recoveredIn12M = true;
      break;
    }
  }

  const capexRecoveryPct = Math.max(0, Math.min(100, (totalOperatingProfitINR / capexINR) * 100));

  return {
    totalParcelsCompleted,
    totalRevenueINR,
    totalDriverEarningsINR,
    totalRiderCreditsINR,
    totalVariableContributionINR,
    totalFixedCostsINR,
    totalOperatingProfitINR,
    endingCashFlowINR,
    capexINR,
    recoveredIn12M,
    paybackMonth,
    capexRecoveryPct,
  };
}

export function generateSensitivityMatrix(
  base: SimulationAssumptions,
  demandFactors: number[] = [0.7, 0.85, 1.0, 1.15, 1.3],
  payoutValues: number[] = [22, 26, 30, 34, 38]
) {
  return demandFactors.map((dfactor) => {
    const demandLabel = `${Math.round(dfactor * 100)}% (${Math.round((base.initialMonthlyDemand * dfactor) / 1000)}k/mo)`;
    const rowObj: { [key: string]: string | number; demandLabel: string } = {
      demandLabel,
    };

    payoutValues.forEach((payout) => {
      const sim = simulate12MonthPilot({
        ...base,
        initialMonthlyDemand: Math.round(base.initialMonthlyDemand * dfactor),
        driverPayout: payout,
      });
      const sum = calculateScenarioSummary(sim, base);
      const profitCrores = Number((sum.totalOperatingProfitINR / 10000000).toFixed(2));
      rowObj[`payout_${payout}`] = profitCrores;
    });

    return rowObj;
  });
}

export function matchSyntheticRoute(
  trip: SyntheticTrip,
  parcel: SyntheticParcel,
  maxAllowedDetourMin = 6.0
): RouteMatchEvaluation {
  // Guardrail 1: Driver Opt-in Check
  if (!trip.driverOptedIn) {
    return {
      status: 'REJECTED_DRIVER_OPT_OUT',
      reason: 'Driver has currently toggled off RouteShare parcel requests for this trip.',
      detourKm: 0,
      detourMin: 0,
      passengerDelayMin: 0,
      driverIncrementalEarning: 0,
      riderCreditAwarded: 0,
      guardrailPassed: false,
    };
  }

  // Corridor compatibility heuristic
  const corridorLookup: Record<string, { detourKm: number; detourMin: number; feasible: boolean }> = {
    'TRP-8401_PCL-101': { detourKm: 0.9, detourMin: 3.8, feasible: true },
    'TRP-8402_PCL-102': { detourKm: 1.4, detourMin: 5.2, feasible: true },
    'TRP-8403_PCL-103': { detourKm: 1.1, detourMin: 4.1, feasible: true },
    'TRP-8404_PCL-104': { detourKm: 5.8, detourMin: 19.5, feasible: false }, // Severe detour violation
    'TRP-8405_PCL-105': { detourKm: 1.2, detourMin: 4.5, feasible: true },
  };

  const pairKey = `${trip.tripId}_${parcel.parcelId}`;
  const compat = corridorLookup[pairKey] || { detourKm: 4.2, detourMin: 15.0, feasible: false };

  // Guardrail 2: Passenger Delay Tolerance
  if (
    !compat.feasible ||
    compat.detourMin > maxAllowedDetourMin ||
    compat.detourMin > trip.maxPassengerDelayMin
  ) {
    const effectiveLimit = Math.min(maxAllowedDetourMin, trip.maxPassengerDelayMin);
    return {
      status: 'REJECTED_DETOUR_GUARDRAIL',
      reason: `Detour (+${compat.detourMin.toFixed(1)}m / ${compat.detourKm.toFixed(1)}km) violates passenger delay guardrail (max ${effectiveLimit}m).`,
      detourKm: compat.detourKm,
      detourMin: compat.detourMin,
      passengerDelayMin: compat.detourMin,
      driverIncrementalEarning: 0,
      riderCreditAwarded: 0,
      guardrailPassed: false,
    };
  }

  // Guardrail 3: Delivery Deadline
  const totalEta = trip.directEtaMin + compat.detourMin;
  if (totalEta > parcel.deadlineMin) {
    return {
      status: 'REJECTED_DEADLINE_VIOLATION',
      reason: `Projected delivery ETA (${Math.round(totalEta)}m) exceeds sender deadline (${parcel.deadlineMin}m).`,
      detourKm: compat.detourKm,
      detourMin: compat.detourMin,
      passengerDelayMin: compat.detourMin,
      driverIncrementalEarning: 0,
      riderCreditAwarded: 0,
      guardrailPassed: false,
    };
  }

  return {
    status: 'MATCHED_SUCCESS',
    reason: `Optimal match! +${compat.detourMin.toFixed(1)}m detour is well within passenger tolerance (+${trip.maxPassengerDelayMin}m).`,
    detourKm: compat.detourKm,
    detourMin: compat.detourMin,
    passengerDelayMin: compat.detourMin,
    driverIncrementalEarning: 30, // Default driver base payout
    riderCreditAwarded: 5, // Default rider discount credit
    guardrailPassed: true,
  };
}
