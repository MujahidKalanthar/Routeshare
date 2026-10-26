import { SimulationAssumptions, SyntheticTrip, SyntheticParcel } from '../types';

export const BASELINE_ASSUMPTIONS: SimulationAssumptions = {
  // Report baseline assumptions
  netParcelRevenue: 60, // Net parcel fee after GST
  driverPayout: 30, // Guaranteed direct driver payout per delivery
  incrementalOpsCost: 12, // Tech dispatch, dynamic micro-insurance, SMS/OTP
  riderCredits: 5, // Passenger co-travel reward discount credit
  driverRewards: 4, // Streak and milestone bonuses
  failureRatePct: 2.5, // 2.5% failed/damaged parcels
  avgClaimCost: 150, // ₹150 claim compensation per failed package

  // Monthly volume and scaling
  initialMonthlyDemand: 150000,
  monthlyGrowthRatePct: 12.0,
  matchingSuccessRatePct: 78.0,
  driverOptInRatePct: 72.0,

  // Fleet & Platform
  activeFleetSize: 25000,
  flatFeeSubscriptionINR: 2000,
  pilotDriverParticipationPct: 40.0,

  // Overheads & CapEx
  monthlyFixedOpsCostINR: 2500000, // ₹25 Lakhs / month
  capexInvestmentCrores: 20.0, // ₹20 Crores
};

export const CONSERVATIVE_ASSUMPTIONS: SimulationAssumptions = {
  ...BASELINE_ASSUMPTIONS,
  initialMonthlyDemand: 90000,
  monthlyGrowthRatePct: 7.0,
  netParcelRevenue: 55,
  driverPayout: 32,
  incrementalOpsCost: 14,
  riderCredits: 6,
  driverRewards: 4,
  failureRatePct: 3.5,
  matchingSuccessRatePct: 65.0,
  driverOptInRatePct: 62.0,
};

export const OPTIMISTIC_ASSUMPTIONS: SimulationAssumptions = {
  ...BASELINE_ASSUMPTIONS,
  initialMonthlyDemand: 220000,
  monthlyGrowthRatePct: 18.0,
  netParcelRevenue: 65,
  driverPayout: 28,
  incrementalOpsCost: 10,
  riderCredits: 4,
  driverRewards: 4,
  failureRatePct: 1.8,
  matchingSuccessRatePct: 85.0,
  driverOptInRatePct: 80.0,
};

export const CAPEX_BREAKDOWN = [
  {
    pillar: 'Matching & Route Integration Engine',
    crores: 5.0,
    pct: 25,
    description: 'Spatial corridor indexing, dynamic detour bounding box algorithms, and real-time passenger route telemetry.',
    color: '#2d6a4f',
  },
  {
    pillar: 'Rider & Driver App UX Overhaul',
    crores: 4.0,
    pct: 20,
    description: 'Driver opt-in toggles, boot capacity declaration, parcel QR/OTP scanning interface, and passenger consent flow.',
    color: '#40916c',
  },
  {
    pillar: 'Credits, Pass & Ledger Engine',
    crores: 3.0,
    pct: 15,
    description: 'Automated rider wallet credit issuance, real-time driver incremental earnings ledger, and payout gateways.',
    color: '#52b788',
  },
  {
    pillar: 'Data, Security & Fraud Prevention',
    crores: 4.0,
    pct: 20,
    description: 'Consignment photo verification, secure tamper-evident packaging distribution, and lost/damaged claims adjudication.',
    color: '#74c69d',
  },
  {
    pillar: 'Staged Testing & Controlled Launch',
    crores: 4.0,
    pct: 20,
    description: 'Sandbox stress-testing, driver onboarding hubs, merchant API integration dry runs, and 500-driver beta corridor trials.',
    color: '#95d5b2',
  },
];

export const ROLLOUT_ROADMAP = [
  {
    phase: 'Phase 1: Validate & Sandbox',
    timeline: 'Months 1 – 3',
    status: 'Preparation & Legal',
    focus: 'Regulatory & Algorithm Architecture',
    milestones: [
      'Engage state transport regulators for Motor Vehicle luggage carriage guidelines & sandbox permits.',
      'Architect spatial detour algorithms with strict 6-minute passenger arrival guardrails.',
      'Establish dynamic micro-insurance partnership for in-transit package coverage.',
    ],
  },
  {
    phase: 'Phase 2: Corridor Alpha',
    timeline: 'Months 4 – 6',
    status: 'Beta Pilot (500 Drivers)',
    focus: 'Single High-Density Radial Arteries',
    milestones: [
      'Deploy pilot app build to 500 top-rated drivers on Indiranagar–Bellandur & Koramangala–Whitefield corridors.',
      'Limit consignments to sealed envelopes & small retail pouches (<1 kg).',
      'Validate rider opt-in sentiment and benchmark passenger delay perceptions.',
    ],
  },
  {
    phase: 'Phase 3: Citywide Pilot',
    timeline: 'Months 7 – 9',
    status: 'Full Pilot (5,000 Drivers)',
    focus: 'Tier-I Metro Commercial Rollout',
    milestones: [
      'Scale to 5,000 participating subscription drivers across 6 dense metro clusters.',
      'Onboard local B2B senders (diagnostic labs, optical dispensaries, legal couriers).',
      'Deploy automated dispute arbitration for damaged or delayed consignments.',
    ],
  },
  {
    phase: 'Phase 4: Optimization & Expansion',
    timeline: 'Months 10 – 12',
    status: 'Scale (10,000+ Drivers)',
    focus: 'Sustainability & Cross-City Playbook',
    milestones: [
      'Achieve 40% driver network opt-in participation (~10,000 active delivery drivers).',
      'Evaluate inter-hub staging micro-lockers at metro stations for high-density drop-offs.',
      'Package operational playbook for secondary Tier-I expansion (Mumbai, Delhi-NCR, Hyderabad).',
    ],
  },
];

export const SYNTHETIC_TRIPS: SyntheticTrip[] = [
  {
    tripId: 'TRP-8401',
    passenger: 'Ananya Sharma',
    origin: 'Indiranagar 100ft Road',
    destination: 'Bellandur EcoSpace',
    directDistanceKm: 11.2,
    directEtaMin: 32,
    maxPassengerDelayMin: 6,
    driverId: 'DRV-509',
    driverName: 'Rajesh Kumar',
    vehicle: 'WagonR (Clean Boot)',
    driverOptedIn: true,
  },
  {
    tripId: 'TRP-8402',
    passenger: 'Vikram Malhotra',
    origin: 'Koramangala 4th Block',
    destination: 'Whitefield ITPL',
    directDistanceKm: 16.5,
    directEtaMin: 44,
    maxPassengerDelayMin: 8,
    driverId: 'DRV-118',
    driverName: 'Suresh Gowda',
    vehicle: 'Dzire Sedan',
    driverOptedIn: true,
  },
  {
    tripId: 'TRP-8403',
    passenger: 'Priya Nambiar',
    origin: 'HSR Layout Sector 1',
    destination: 'Electronic City Phase 1',
    directDistanceKm: 13.8,
    directEtaMin: 28,
    maxPassengerDelayMin: 5,
    driverId: 'DRV-784',
    driverName: 'Manoj Verma',
    vehicle: 'Toyota Etios',
    driverOptedIn: false, // Driver opts out this trip
  },
  {
    tripId: 'TRP-8404',
    passenger: 'Arjun Rao',
    origin: 'Domlur Flyover',
    destination: 'Indiranagar Metro Station',
    directDistanceKm: 3.4,
    directEtaMin: 14,
    maxPassengerDelayMin: 4,
    driverId: 'DRV-332',
    driverName: 'Deepak Patel',
    vehicle: 'Renault Triber',
    driverOptedIn: true,
  },
  {
    tripId: 'TRP-8405',
    passenger: 'Neha Deshmukh',
    origin: 'MG Road Metro Station',
    destination: 'Marathahalli Multiplex',
    directDistanceKm: 12.0,
    directEtaMin: 36,
    maxPassengerDelayMin: 7,
    driverId: 'DRV-641',
    driverName: 'Karthik Pillai',
    vehicle: 'Hyundai Aura',
    driverOptedIn: true,
  },
];

export const SYNTHETIC_PARCELS: SyntheticParcel[] = [
  {
    parcelId: 'PCL-101',
    sender: 'HealthFirst Pathology Labs',
    pickup: 'Indiranagar 12th Main',
    dropoff: 'Bellandur Clinic Hub',
    size: 'Document Envelope (<0.5 kg)',
    weightKg: 0.3,
    deadlineMin: 60,
    maxDetourAllowedKm: 1.2,
    requiresVerification: true,
  },
  {
    parcelId: 'PCL-102',
    sender: 'FastFix Electronics Spares',
    pickup: 'Koramangala Sony World Signal',
    dropoff: 'Hoodi Tech Zone (Whitefield)',
    size: 'Shoebox Parcel (1.8 kg)',
    weightKg: 1.8,
    deadlineMin: 90,
    maxDetourAllowedKm: 1.8,
    requiresVerification: true,
  },
  {
    parcelId: 'PCL-103',
    sender: 'FabArtisan Organic Handloom',
    pickup: 'Silk Board Junction',
    dropoff: 'Velankani Tech Park (EC)',
    size: 'Backpack Pack (3.2 kg)',
    weightKg: 3.2,
    deadlineMin: 75,
    maxDetourAllowedKm: 2.2,
    requiresVerification: false,
  },
  {
    parcelId: 'PCL-104',
    sender: 'MedExpress Pharmacy',
    pickup: 'Ulsoor Road Chemist',
    dropoff: 'Hebbal Flyover (Cross-City)',
    size: 'Medicine Pouch (<0.4 kg)',
    weightKg: 0.4,
    deadlineMin: 40,
    maxDetourAllowedKm: 1.0,
    requiresVerification: true,
  },
  {
    parcelId: 'PCL-105',
    sender: 'Corporate Legal Chambers',
    pickup: 'Trinity Circle',
    dropoff: 'Spice Garden Marathahalli',
    size: 'Legal Dossier (<1.0 kg)',
    weightKg: 0.9,
    deadlineMin: 80,
    maxDetourAllowedKm: 1.5,
    requiresVerification: true,
  },
];
