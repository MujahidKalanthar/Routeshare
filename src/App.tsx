import React, { useState, useMemo } from 'react';
import {
  Package,
  TrendingUp,
  ShieldAlert,
  Users,
  Compass,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Layers,
  Calendar,
  FileCode,
  ArrowRight,
  TrendingDown,
  Clock,
  Car,
  Award,
} from 'lucide-react';
import { SimulationAssumptions } from './types';
import {
  BASELINE_ASSUMPTIONS,
  CONSERVATIVE_ASSUMPTIONS,
  OPTIMISTIC_ASSUMPTIONS,
  CAPEX_BREAKDOWN,
  ROLLOUT_ROADMAP,
  SYNTHETIC_TRIPS,
  SYNTHETIC_PARCELS,
} from './data/defaults';
import {
  calculateUnitEconomics,
  simulate12MonthPilot,
  calculateScenarioSummary,
  generateSensitivityMatrix,
  matchSyntheticRoute,
} from './utils/calculations';

type ActiveTab =
  | 'executive'
  | 'economics'
  | 'pilot'
  | 'matching'
  | 'comparison'
  | 'budget'
  | 'python';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('executive');
  const [activeScenario, setActiveScenario] = useState<string>('base');
  const [assumptions, setAssumptions] = useState<SimulationAssumptions>({ ...BASELINE_ASSUMPTIONS });

  // Route matching interactive state
  const [maxDetourMinutes, setMaxDetourMinutes] = useState<number>(6.0);
  const [selectedTripIndex, setSelectedTripIndex] = useState<number>(0);

  // Scenario presets handler
  const handleScenarioChange = (scenario: string) => {
    setActiveScenario(scenario);
    if (scenario === 'conservative') {
      setAssumptions({ ...CONSERVATIVE_ASSUMPTIONS });
    } else if (scenario === 'optimistic') {
      setAssumptions({ ...OPTIMISTIC_ASSUMPTIONS });
    } else if (scenario === 'base') {
      setAssumptions({ ...BASELINE_ASSUMPTIONS });
    }
  };

  const handleReset = () => {
    handleScenarioChange('base');
  };

  const updateAssumption = <K extends keyof SimulationAssumptions>(
    key: K,
    value: SimulationAssumptions[K]
  ) => {
    setActiveScenario('custom');
    setAssumptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Run core financial & simulation calculations
  const unitEcon = useMemo(() => calculateUnitEconomics(assumptions), [assumptions]);
  const simRecords = useMemo(() => simulate12MonthPilot(assumptions), [assumptions]);
  const summary = useMemo(
    () => calculateScenarioSummary(simRecords, assumptions),
    [simRecords, assumptions]
  );
  const sensitivityMatrix = useMemo(
    () => generateSensitivityMatrix(assumptions),
    [assumptions]
  );

  // Evaluate synthetic corridor route matches
  const routeMatches = useMemo(() => {
    return SYNTHETIC_TRIPS.map((trip, idx) => {
      const parcel = SYNTHETIC_PARCELS[idx];
      const evaluation = matchSyntheticRoute(trip, parcel, maxDetourMinutes);
      return { trip, parcel, evaluation };
    });
  }, [maxDetourMinutes]);

  const selectedMatch = routeMatches[selectedTripIndex];

  // Formatting helpers
  const formatINR = (val: number) => {
    if (Math.abs(val) >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(val) >= 100000) {
      return `₹${(val / 100000).toFixed(1)} Lakh`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-[#0f1215] text-[#e5e7eb] flex flex-col font-sans selection:bg-[#2d6a4f] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#252b33] bg-[#14181d]/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1f262e] border border-[#2d6a4f]/50 flex items-center justify-center text-[#52b788] shadow-inner">
              <Package className="w-5 h-5 text-[#52b788]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">RouteShare Pilot Simulator</h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#2d6a4f]/20 text-[#52b788] border border-[#2d6a4f]/40">
                  Strategy Wiz Finals
                </span>
              </div>
              <p className="text-xs text-[#9ca3af]">
                Team VoltEdge &bull; Renaissance 10.0, MNNIT Allahabad &bull; Tier-I Metro Simulation
              </p>
            </div>
          </div>

          {/* Scenario Selector & Reset Button */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="inline-flex bg-[#191e24] p-1 rounded-lg border border-[#252b33] text-xs font-medium">
              <button
                onClick={() => handleScenarioChange('conservative')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeScenario === 'conservative'
                    ? 'bg-[#252b33] text-amber-400 font-semibold shadow-sm'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Conservative Stress
              </button>
              <button
                onClick={() => handleScenarioChange('base')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeScenario === 'base'
                    ? 'bg-[#2d6a4f] text-white font-semibold shadow-sm'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Base Case (Baseline)
              </button>
              <button
                onClick={() => handleScenarioChange('optimistic')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeScenario === 'optimistic'
                    ? 'bg-[#252b33] text-[#52b788] font-semibold shadow-sm'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Optimistic Fast-Ramp
              </button>
              {activeScenario === 'custom' && (
                <span className="px-3 py-1.5 rounded-md bg-[#252b33] text-[#74c69d] font-semibold">
                  Custom &bull;
                </span>
              )}
            </div>

            <button
              onClick={handleReset}
              title="Reset to default baseline report assumptions"
              className="p-2 text-xs rounded-lg border border-[#252b33] bg-[#191e24] hover:bg-[#252b33] text-[#9ca3af] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Primary Tabs */}
      <div className="border-b border-[#252b33] bg-[#111418] px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'executive', label: 'Executive Dashboard', icon: TrendingUp },
            { id: 'economics', label: 'Unit Economics & Assumptions', icon: DollarSign },
            { id: 'pilot', label: '12-Month Pilot & Sensitivity', icon: Calendar },
            { id: 'matching', label: 'Route-Matching Simulator', icon: Compass },
            { id: 'comparison', label: 'Business Model Comparison', icon: Layers },
            { id: 'budget', label: '₹20 Cr Budget & Rollout', icon: Award },
            { id: 'python', label: 'Python / Streamlit Code', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-[#52b788] text-white bg-[#191e24]/60'
                    : 'border-transparent text-[#9ca3af] hover:text-white hover:border-[#38414e]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#52b788]' : 'text-[#6b7280]'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        {/* Transparency Banner */}
        <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200/90 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-300">Model Transparency & Audit Notice:</span> All calculations utilize the illustrative starting assumptions submitted in Team VoltEdge's proposal (₹60 Net Parcel Revenue, ₹30 Driver Payout, ₹12 Ops Cost, ₹5 Rider Credits, ₹4 Driver Rewards = ₹18 before rewards, ₹9 after rewards). Figures represent simulated financial feasibility in a dense Tier-I metro, not verified historical market results or granted regulatory permits.
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'executive' && (
          <div className="space-y-6">
            {/* Top 4 Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#252b33] bg-[#161a20] relative overflow-hidden">
                <div className="text-xs text-[#9ca3af] font-medium flex items-center justify-between">
                  <span>Total Parcels Completed</span>
                  <Package className="w-4 h-4 text-[#52b788]" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {summary.totalParcelsCompleted.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#52b788] mt-1 flex items-center gap-1 font-medium">
                  <span>From {simRecords.reduce((a, b) => a + b.demandRequests, 0).toLocaleString('en-IN')} demand requests</span>
                </div>
                <div className="text-[11px] text-[#6b7280] mt-0.5">
                  {(100 - assumptions.failureRatePct).toFixed(1)}% fulfillment success rate
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#252b33] bg-[#161a20]">
                <div className="text-xs text-[#9ca3af] font-medium flex items-center justify-between">
                  <span>Total Parcel Revenue</span>
                  <DollarSign className="w-4 h-4 text-[#52b788]" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {formatINR(summary.totalRevenueINR)}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  At average net fee of ₹{assumptions.netParcelRevenue}/parcel
                </div>
                <div className="text-[11px] text-[#52b788] mt-0.5 font-medium">
                  ₹0 taken from passenger ride fares
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#252b33] bg-[#161a20]">
                <div className="text-xs text-[#9ca3af] font-medium flex items-center justify-between">
                  <span>Variable Contribution</span>
                  <TrendingUp className="w-4 h-4 text-[#52b788]" />
                </div>
                <div className="text-2xl font-bold text-[#52b788] mt-2">
                  {formatINR(summary.totalVariableContributionINR)}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  {unitEcon.contributionMarginPct.toFixed(1)}% contribution margin
                </div>
                <div className="text-[11px] text-[#6b7280] mt-0.5">
                  ₹{unitEcon.netContributionPerParcel.toFixed(2)} net margin / package
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#252b33] bg-[#161a20]">
                <div className="text-xs text-[#9ca3af] font-medium flex items-center justify-between">
                  <span>12-Month Operating Profit</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${summary.totalOperatingProfitINR > 0 ? 'bg-[#52b788]' : 'bg-red-400'}`} />
                </div>
                <div className={`text-2xl font-bold mt-2 ${summary.totalOperatingProfitINR > 0 ? 'text-[#52b788]' : 'text-red-400'}`}>
                  {formatINR(summary.totalOperatingProfitINR)}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  After ₹{(summary.totalFixedCostsINR / 10000000).toFixed(2)} Cr fixed ops
                </div>
                <div className="text-[11px] text-[#6b7280] mt-0.5">
                  {summary.totalOperatingProfitINR > 0 ? 'Operating cash-flow positive' : 'Operating deficit'}
                </div>
              </div>
            </div>

            {/* Secondary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg border border-[#252b33] bg-[#14181d]">
                <div className="text-xs text-[#9ca3af]">Driver Incremental Earnings</div>
                <div className="text-lg font-semibold text-white mt-1">
                  {formatINR(summary.totalDriverEarningsINR)}
                </div>
                <div className="text-[11px] text-[#52b788] mt-0.5 font-medium">
                  ~₹{Math.round(summary.totalDriverEarningsINR / Math.max(1, simRecords[simRecords.length - 1].activeDrivers)).toLocaleString('en-IN')}/driver annually
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#252b33] bg-[#14181d]">
                <div className="text-xs text-[#9ca3af]">Rider Co-Travel Credits</div>
                <div className="text-lg font-semibold text-white mt-1">
                  {formatINR(summary.totalRiderCreditsINR)}
                </div>
                <div className="text-[11px] text-[#9ca3af] mt-0.5">
                  Capped @ ₹{assumptions.riderCredits} toward future ride discounts
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#252b33] bg-[#14181d]">
                <div className="text-xs text-[#9ca3af]">Monthly Break-Even Volume</div>
                <div className="text-lg font-semibold text-white mt-1">
                  {unitEcon.monthlyBreakEvenVolume.toLocaleString('en-IN')} parcels/mo
                </div>
                <div className="text-[11px] text-[#9ca3af] mt-0.5">
                  ~{Math.round(unitEcon.monthlyBreakEvenVolume / 30).toLocaleString('en-IN')} parcels/day metro-wide
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#252b33] bg-[#14181d]">
                <div className="text-xs text-[#9ca3af]">₹20 Cr CapEx Status</div>
                <div className={`text-lg font-semibold mt-1 ${summary.recoveredIn12M ? 'text-[#52b788]' : 'text-amber-400'}`}>
                  {summary.recoveredIn12M ? `Recovered in M${summary.paybackMonth}` : 'Unrecovered in 12M'}
                </div>
                <div className="text-[11px] text-[#9ca3af] mt-0.5">
                  {summary.capexRecoveryPct.toFixed(1)}% of ₹20 Cr amortized in Year 1
                </div>
              </div>
            </div>

            {/* Visual Charts: Volume vs Monthly Operating Net Profit */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Trajectory SVG Chart */}
              <div className="lg:col-span-2 p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-base">Monthly Volume Ramp & Operating Trajectory</h3>
                    <p className="text-xs text-[#9ca3af]">Monthly completed parcel volume (bars) vs. net operating profit in ₹ Lakhs (line)</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-[#9ca3af]">
                      <span className="w-3 h-3 rounded-sm bg-[#2d6a4f]" /> Completed Parcels
                    </span>
                    <span className="flex items-center gap-1.5 text-[#9ca3af]">
                      <span className="w-3 h-1 bg-[#52b788] rounded-full" /> Net Profit (₹ Lakh)
                    </span>
                  </div>
                </div>

                {/* SVG Combo Chart */}
                <div className="w-full h-64 pt-4">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                    {/* Horizontal grid lines */}
                    <line x1="40" y1="20" x2="580" y2="20" stroke="#252b33" strokeDasharray="3 3" />
                    <line x1="40" y1="80" x2="580" y2="80" stroke="#252b33" strokeDasharray="3 3" />
                    <line x1="40" y1="140" x2="580" y2="140" stroke="#252b33" strokeDasharray="3 3" />
                    <line x1="40" y1="180" x2="580" y2="180" stroke="#374151" />

                    {/* Bars for Completed Parcels */}
                    {simRecords.map((r, i) => {
                      const maxParcels = Math.max(...simRecords.map((m) => m.completedParcels), 1);
                      const barHeight = (r.completedParcels / maxParcels) * 140;
                      const x = 55 + i * 44;
                      const y = 180 - barHeight;

                      return (
                        <g key={r.month} className="group cursor-pointer">
                          <rect
                            x={x}
                            y={y}
                            width="24"
                            height={barHeight}
                            rx="3"
                            fill="#2d6a4f"
                            className="hover:fill-[#40916c] transition-colors"
                          />
                          <text
                            x={x + 12}
                            y="195"
                            fill="#9ca3af"
                            fontSize="9"
                            textAnchor="middle"
                          >
                            {r.month}
                          </text>
                        </g>
                      );
                    })}

                    {/* Polyline for Net Operating Profit (₹ Lakhs) */}
                    {(() => {
                      const maxProfit = Math.max(...simRecords.map((m) => m.monthlyNetProfitINR / 100000), 10);
                      const minProfit = Math.min(...simRecords.map((m) => m.monthlyNetProfitINR / 100000), -20);
                      const range = maxProfit - minProfit || 1;

                      const points = simRecords
                        .map((r, i) => {
                          const val = r.monthlyNetProfitINR / 100000;
                          const x = 55 + i * 44 + 12;
                          const y = 160 - ((val - minProfit) / range) * 130;
                          return `${x},${y}`;
                        })
                        .join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#52b788"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                          {simRecords.map((r, i) => {
                            const val = r.monthlyNetProfitINR / 100000;
                            const x = 55 + i * 44 + 12;
                            const y = 160 - ((val - minProfit) / range) * 130;
                            return (
                              <circle
                                key={`pt-${r.month}`}
                                cx={x}
                                cy={y}
                                r="3.5"
                                fill="#0f1215"
                                stroke="#52b788"
                                strokeWidth="2"
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#6b7280] border-t border-[#252b33] pt-2">
                  <span>Month 1: {simRecords[0].completedParcels.toLocaleString('en-IN')} parcels (₹{(simRecords[0].monthlyNetProfitINR / 100000).toFixed(1)}L Net)</span>
                  <span>Month 12: {simRecords[11].completedParcels.toLocaleString('en-IN')} parcels (₹{(simRecords[11].monthlyNetProfitINR / 100000).toFixed(1)}L Net)</span>
                </div>
              </div>

              {/* Service Impact & Guardrails Card */}
              <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-semibold text-white text-base">Passenger Guardrails & Trust</h3>
                  <p className="text-xs text-[#9ca3af]">Guaranteed protections preventing passenger service degradation</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#14181d] border border-[#252b33] flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#52b788] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">5–8 Min Max Detour Cap</div>
                      <div className="text-[#9ca3af] text-[11px] mt-0.5">
                        Trips requiring detours beyond threshold are rejected automatically by dispatch algorithms.
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#14181d] border border-[#252b33] flex items-start gap-2.5">
                    <Car className="w-4 h-4 text-[#52b788] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Driver Opt-in Transparency</div>
                      <div className="text-[#9ca3af] text-[11px] mt-0.5">
                        Drivers see exact pickup pin and guaranteed payout (₹{assumptions.driverPayout}) before accepting co-travel requests.
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#14181d] border border-[#252b33] flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-[#52b788] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Rider Consent Reward</div>
                      <div className="text-[#9ca3af] text-[11px] mt-0.5">
                        Passengers on matched co-trips receive ₹{assumptions.riderCredits} in future ride credits, preserving net sentiment.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#1f262e]/50 border border-[#2d6a4f]/30 text-[11px] text-[#9ca3af]">
                  <strong className="text-white">Strategic Verdict:</strong> RouteShare succeeds only if passenger trip reliability remains pristine. Parcels ride as marginal payload without dictating the passenger itinerary.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: UNIT ECONOMICS & ASSUMPTIONS */}
        {/* ======================================================== */}
        {activeTab === 'economics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Sliders Panel (5 cols) */}
              <div className="lg:col-span-5 p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-5">
                <div className="flex items-center justify-between border-b border-[#252b33] pb-3">
                  <div>
                    <h3 className="font-semibold text-white text-base">Pilot Assumptions Controls</h3>
                    <p className="text-xs text-[#9ca3af]">Adjust variables to stress-test unit economics</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#252b33] text-[#52b788]">
                    LIVE AUDIT
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Net Parcel Revenue */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#d1d5db] font-medium">Net Parcel Fee (after taxes)</label>
                      <span className="font-mono font-bold text-white">₹{assumptions.netParcelRevenue}</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="1"
                      value={assumptions.netParcelRevenue}
                      onChange={(e) => updateAssumption('netParcelRevenue', Number(e.target.value))}
                      className="w-full accent-[#52b788] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6b7280]">
                      <span>₹40 (Discounted)</span>
                      <span>Baseline: ₹60</span>
                      <span>₹100 (Express)</span>
                    </div>
                  </div>

                  {/* Driver Payout */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#d1d5db] font-medium">Driver Direct Payout</label>
                      <span className="font-mono font-bold text-[#52b788]">₹{assumptions.driverPayout}</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="50"
                      step="1"
                      value={assumptions.driverPayout}
                      onChange={(e) => updateAssumption('driverPayout', Number(e.target.value))}
                      className="w-full accent-[#52b788] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6b7280]">
                      <span>₹15</span>
                      <span>Baseline: ₹30</span>
                      <span>₹50</span>
                    </div>
                  </div>

                  {/* Incremental Ops */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#d1d5db] font-medium">Incremental Ops & Micro-Insurance</label>
                      <span className="font-mono font-bold text-white">₹{assumptions.incrementalOpsCost}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="25"
                      step="0.5"
                      value={assumptions.incrementalOpsCost}
                      onChange={(e) => updateAssumption('incrementalOpsCost', Number(e.target.value))}
                      className="w-full accent-[#52b788] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6b7280]">
                      <span>₹5</span>
                      <span>Baseline: ₹12</span>
                      <span>₹25</span>
                    </div>
                  </div>

                  {/* Rider Credits */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#d1d5db] font-medium">Rider Co-Travel Credits</label>
                      <span className="font-mono font-bold text-white">₹{assumptions.riderCredits}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={assumptions.riderCredits}
                      onChange={(e) => updateAssumption('riderCredits', Number(e.target.value))}
                      className="w-full accent-[#52b788] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6b7280]">
                      <span>₹0 (None)</span>
                      <span>Baseline: ₹5</span>
                      <span>₹15 (Aggressive)</span>
                    </div>
                  </div>

                  {/* Driver Rewards */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#d1d5db] font-medium">Driver Streak / Milestone Rewards</label>
                      <span className="font-mono font-bold text-white">₹{assumptions.driverRewards}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={assumptions.driverRewards}
                      onChange={(e) => updateAssumption('driverRewards', Number(e.target.value))}
                      className="w-full accent-[#52b788] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6b7280]">
                      <span>₹0</span>
                      <span>Baseline: ₹4</span>
                      <span>₹15</span>
                    </div>
                  </div>

                  {/* Failure Rate */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#d1d5db] font-medium">Delivery Failure / Claims Rate</label>
                      <span className="font-mono font-bold text-amber-400">{assumptions.failureRatePct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="8"
                      step="0.1"
                      value={assumptions.failureRatePct}
                      onChange={(e) => updateAssumption('failureRatePct', Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6b7280]">
                      <span>0.5% (Elite)</span>
                      <span>Baseline: 2.5%</span>
                      <span>8.0% (Disrupted)</span>
                    </div>
                  </div>

                  {/* Initial Demand & Growth */}
                  <div className="pt-2 border-t border-[#252b33] grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#9ca3af] text-[11px] block mb-1">Month 1 Demand</label>
                      <input
                        type="number"
                        step="10000"
                        value={assumptions.initialMonthlyDemand}
                        onChange={(e) => updateAssumption('initialMonthlyDemand', Math.max(1000, Number(e.target.value)))}
                        className="w-full bg-[#14181d] border border-[#252b33] rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[#9ca3af] text-[11px] block mb-1">Monthly Growth (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={assumptions.monthlyGrowthRatePct}
                        onChange={(e) => updateAssumption('monthlyGrowthRatePct', Number(e.target.value))}
                        className="w-full bg-[#14181d] border border-[#252b33] rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Waterfall & Audit Ledger (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Visual Waterfall Card */}
                <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-base">Single-Parcel Unit Waterfall</h3>
                      <p className="text-xs text-[#9ca3af]">Step-by-step net margin decomposition per delivery</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#9ca3af]">Net Contribution</div>
                      <div className="text-xl font-bold font-mono text-[#52b788]">
                        ₹{unitEcon.netContributionPerParcel.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Visual Waterfall Bars */}
                  <div className="space-y-2.5 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">Gross Parcel Fee (Net of GST)</span>
                        <span className="font-mono text-white font-bold">+₹{unitEcon.netParcelRevenue.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#1f262e] overflow-hidden">
                        <div className="h-full bg-[#52b788]" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div className="space-y-1 pl-3 border-l-2 border-[#252b33]">
                      <div className="flex justify-between text-xs text-[#9ca3af]">
                        <span>(-) Driver Direct Payout</span>
                        <span className="font-mono text-red-400">-₹{unitEcon.driverPayout.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-[#9ca3af]">
                        <span>(-) Incremental Ops & Dispatch</span>
                        <span className="font-mono text-red-400">-₹{unitEcon.incrementalOpsCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-[#9ca3af]">
                        <span>(-) Expected Failure / Claims Risk</span>
                        <span className="font-mono text-red-400">-₹{unitEcon.expectedFailureCost.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#14181d] border border-[#252b33] flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold text-white">Contribution Before Rewards</span>
                        <div className="text-[10px] text-[#6b7280]">Report Baseline: ₹18.00</div>
                      </div>
                      <span className="font-mono font-bold text-white text-sm">
                        ₹{unitEcon.contributionBeforeRewards.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-1 pl-3 border-l-2 border-[#252b33]">
                      <div className="flex justify-between text-xs text-[#9ca3af]">
                        <span>(-) Rider Co-Travel Credits</span>
                        <span className="font-mono text-red-400">-₹{unitEcon.riderCredits.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-[#9ca3af]">
                        <span>(-) Driver Streak Incentives</span>
                        <span className="font-mono text-red-400">-₹{unitEcon.driverRewards.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#1f262e] border border-[#2d6a4f]/50 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#52b788] text-sm">Net Contribution Per Parcel</span>
                        <div className="text-[11px] text-[#9ca3af]">Report Baseline: ₹9.00 (before claims)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono text-[#52b788]">
                          ₹{unitEcon.netContributionPerParcel.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#9ca3af]">
                          {unitEcon.contributionMarginPct.toFixed(1)}% Margin
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Table */}
                <div className="p-4 rounded-xl border border-[#252b33] bg-[#161a20]">
                  <h4 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
                    Audit Verification Ledger
                  </h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#252b33] text-[#6b7280]">
                        <th className="text-left pb-2 font-medium">Metric</th>
                        <th className="text-right pb-2 font-medium">Current Model</th>
                        <th className="text-right pb-2 font-medium">Submitted Baseline</th>
                        <th className="text-right pb-2 font-medium">Audit Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252b33]/60 font-mono">
                      <tr>
                        <td className="py-2 text-[#d1d5db]">Net Parcel Fee</td>
                        <td className="py-2 text-right text-white">₹{unitEcon.netParcelRevenue.toFixed(2)}</td>
                        <td className="py-2 text-right text-[#9ca3af]">₹60.00</td>
                        <td className="py-2 text-right font-sans text-[11px] text-[#9ca3af]">Post-tax revenue input</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#d1d5db]">Driver Payout</td>
                        <td className="py-2 text-right text-red-400">-₹{unitEcon.driverPayout.toFixed(2)}</td>
                        <td className="py-2 text-right text-[#9ca3af]">-₹30.00</td>
                        <td className="py-2 text-right font-sans text-[11px] text-[#9ca3af]">Direct visible compensation</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#d1d5db]">Incremental Ops</td>
                        <td className="py-2 text-right text-red-400">-₹{unitEcon.incrementalOpsCost.toFixed(2)}</td>
                        <td className="py-2 text-right text-[#9ca3af]">-₹12.00</td>
                        <td className="py-2 text-right font-sans text-[11px] text-[#9ca3af]">Dispatch + micro-insurance</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#d1d5db]">Contrib Pre-Rewards</td>
                        <td className="py-2 text-right text-white font-bold">₹{unitEcon.contributionBeforeRewards.toFixed(2)}</td>
                        <td className="py-2 text-right text-[#9ca3af]">₹18.00</td>
                        <td className="py-2 text-right font-sans text-[11px] text-[#9ca3af]">Baseline matches report</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#d1d5db]">Rider Credits</td>
                        <td className="py-2 text-right text-red-400">-₹{unitEcon.riderCredits.toFixed(2)}</td>
                        <td className="py-2 text-right text-[#9ca3af]">-₹5.00</td>
                        <td className="py-2 text-right font-sans text-[11px] text-[#9ca3af]">Co-traveler incentive</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#d1d5db]">Driver Rewards</td>
                        <td className="py-2 text-right text-red-400">-₹{unitEcon.driverRewards.toFixed(2)}</td>
                        <td className="py-2 text-right text-[#9ca3af]">-₹4.00</td>
                        <td className="py-2 text-right font-sans text-[11px] text-[#9ca3af]">Streak milestone bonus</td>
                      </tr>
                      <tr className="bg-[#1f262e]/30">
                        <td className="py-2.5 text-[#52b788] font-bold">Net Contribution</td>
                        <td className="py-2.5 text-right text-[#52b788] font-bold">₹{unitEcon.netContributionPerParcel.toFixed(2)}</td>
                        <td className="py-2.5 text-right text-[#9ca3af]">₹9.00</td>
                        <td className="py-2.5 text-right font-sans text-[11px] text-[#52b788]">Surplus to cover overhead</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: 12-MONTH PILOT SIMULATION */}
        {/* ======================================================== */}
        {activeTab === 'pilot' && (
          <div className="space-y-6">
            {/* Cumulative Cash Flow Chart vs ₹20 Cr line */}
            <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white text-base">12-Month Cumulative Cash Flow vs. ₹20 Crore CapEx</h3>
                  <p className="text-xs text-[#9ca3af]">
                    Assesses whether cumulative operating cash flows recover the initial ₹20 Cr product/engineering outlay
                  </p>
                </div>
                <div className="text-xs">
                  <span className={`px-2.5 py-1 rounded-md font-semibold ${summary.recoveredIn12M ? 'bg-[#2d6a4f] text-white' : 'bg-[#252b33] text-amber-400'}`}>
                    {summary.recoveredIn12M ? `Breakeven achieved in M${summary.paybackMonth}` : `₹20 Cr CapEx Unrecovered in 12M (${summary.capexRecoveryPct.toFixed(1)}% Amortized)`}
                  </span>
                </div>
              </div>

              {/* Cash Flow SVG Line Chart */}
              <div className="w-full h-64 pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="580" y2="20" stroke="#252b33" strokeDasharray="3 3" />
                  <line x1="40" y1="70" x2="580" y2="70" stroke="#252b33" strokeDasharray="3 3" />
                  <line x1="40" y1="120" x2="580" y2="120" stroke="#252b33" strokeDasharray="3 3" />

                  {/* Breakeven line at y=0 (scaled) */}
                  <line x1="40" y1="50" x2="580" y2="50" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="575" y="45" fill="#eab308" fontSize="10" textAnchor="end">
                    Break-even (₹0 Net Position)
                  </text>

                  {/* Curve for Cumulative Cash Flow (starts at -20 Cr) */}
                  {(() => {
                    const minVal = -20.0;
                    const maxVal = Math.max(5.0, ...simRecords.map((r) => r.cumulativeCashFlowINR / 10000000));
                    const range = maxVal - minVal;

                    const getY = (cr: number) => {
                      return 180 - ((cr - minVal) / range) * 150;
                    };

                    const pts = simRecords
                      .map((r, i) => {
                        const cr = r.cumulativeCashFlowINR / 10000000;
                        const x = 50 + i * 44;
                        const y = getY(cr);
                        return `${x},${y}`;
                      })
                      .join(' ');

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#52b788"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pts}
                        />
                        {simRecords.map((r, i) => {
                          const cr = r.cumulativeCashFlowINR / 10000000;
                          const x = 50 + i * 44;
                          const y = getY(cr);
                          return (
                            <g key={r.month}>
                              <circle
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#0f1215"
                                stroke="#52b788"
                                strokeWidth="2.5"
                              />
                              <text
                                x={x}
                                y="195"
                                fill="#9ca3af"
                                fontSize="9"
                                textAnchor="middle"
                              >
                                {r.month}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Monthly Schedule Table */}
            <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-3">
              <h3 className="font-semibold text-white text-base">Detailed 12-Month Pilot Schedule</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#252b33] text-[#6b7280]">
                      <th className="py-2.5 px-2">Month</th>
                      <th className="py-2.5 px-2 text-right">Demand</th>
                      <th className="py-2.5 px-2 text-right">Drivers</th>
                      <th className="py-2.5 px-2 text-right">Completed</th>
                      <th className="py-2.5 px-2 text-right">Gross Rev</th>
                      <th className="py-2.5 px-2 text-right">Driver Pay</th>
                      <th className="py-2.5 px-2 text-right">Variable Contrib</th>
                      <th className="py-2.5 px-2 text-right">Fixed Cost</th>
                      <th className="py-2.5 px-2 text-right">Net Profit</th>
                      <th className="py-2.5 px-2 text-right">Cum Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252b33]/60 font-mono">
                    {simRecords.map((r) => (
                      <tr key={r.month} className="hover:bg-[#1f262e]/40 transition-colors">
                        <td className="py-2 px-2 text-white font-bold">{r.month}</td>
                        <td className="py-2 px-2 text-right text-[#9ca3af]">{r.demandRequests.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right text-[#9ca3af]">{r.activeDrivers.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right text-white font-semibold">{r.completedParcels.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right text-[#d1d5db]">₹{(r.revenueINR / 100000).toFixed(1)}L</td>
                        <td className="py-2 px-2 text-right text-red-400">₹{(r.driverPayoutsINR / 100000).toFixed(1)}L</td>
                        <td className="py-2 px-2 text-right text-[#52b788]">₹{(r.monthlyContributionINR / 100000).toFixed(1)}L</td>
                        <td className="py-2 px-2 text-right text-[#9ca3af]">₹{(r.fixedCostINR / 100000).toFixed(1)}L</td>
                        <td className={`py-2 px-2 text-right font-bold ${r.monthlyNetProfitINR >= 0 ? 'text-[#52b788]' : 'text-red-400'}`}>
                          ₹{(r.monthlyNetProfitINR / 100000).toFixed(1)}L
                        </td>
                        <td className={`py-2 px-2 text-right font-bold ${r.cumulativeCashFlowINR >= 0 ? 'text-[#52b788]' : 'text-[#d1d5db]'}`}>
                          ₹{(r.cumulativeCashFlowINR / 10000000).toFixed(2)} Cr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2-Way Sensitivity Matrix Table */}
            <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base">2-Way Sensitivity Matrix: 12-Month Operating Profit (₹ Crores)</h3>
                  <p className="text-xs text-[#9ca3af]">
                    Assessing financial resilience against varying parcel demand (rows) and driver payout per parcel (columns)
                  </p>
                </div>
                <span className="text-[11px] text-[#52b788] bg-[#2d6a4f]/20 px-2 py-0.5 rounded border border-[#2d6a4f]/40">
                  Resilience Stress Test
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#252b33] text-[#6b7280]">
                      <th className="py-2 px-3">Demand Scenario</th>
                      <th className="py-2 px-3 text-right">Payout ₹22</th>
                      <th className="py-2 px-3 text-right">Payout ₹26</th>
                      <th className="py-2 px-3 text-right">Payout ₹30 (Baseline)</th>
                      <th className="py-2 px-3 text-right">Payout ₹34</th>
                      <th className="py-2 px-3 text-right">Payout ₹38</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252b33]/60 font-mono">
                    {sensitivityMatrix.map((row, i) => (
                      <tr key={i} className="hover:bg-[#1f262e]/40">
                        <td className="py-2 px-3 font-sans text-white font-medium">{row.demandLabel}</td>
                        {[22, 26, 30, 34, 38].map((payout) => {
                          const val = row[`payout_${payout}`] as number;
                          const isBaseline = payout === 30 && i === 2;
                          return (
                            <td
                              key={payout}
                              className={`py-2 px-3 text-right font-bold ${
                                isBaseline ? 'bg-[#2d6a4f]/30 border border-[#52b788]/40 ' : ''
                              }${val >= 0 ? 'text-[#52b788]' : 'text-red-400'}`}
                            >
                              ₹{val.toFixed(2)} Cr
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#6b7280] pt-1">
                Note: Shaded cell highlights baseline parameters (100% Demand, ₹30 Driver Payout). If driver payout increases to ₹38 or demand drops to 70%, operating margins shrink substantially, confirming sensitivity to driver compensation levels.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: ROUTE-MATCHING SIMULATION */}
        {/* ======================================================== */}
        {activeTab === 'matching' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white text-base">Algorithmic Route-Matching & Guardrail Simulator</h3>
                  <p className="text-xs text-[#9ca3af]">
                    Simulating ride-hailing co-travel matches along dense Tier-I metro corridors (Bangalore Radial Arteries)
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#14181d] px-3 py-1.5 rounded-lg border border-[#252b33]">
                  <span className="text-xs text-[#9ca3af]">Max Permitted Detour:</span>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.5"
                    value={maxDetourMinutes}
                    onChange={(e) => setMaxDetourMinutes(Number(e.target.value))}
                    className="w-24 accent-[#52b788] cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-[#52b788]">{maxDetourMinutes.toFixed(1)}m</span>
                </div>
              </div>

              {/* Synthetic Corridor Trips Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#252b33] text-[#6b7280]">
                      <th className="py-2.5 px-3">Trip ID</th>
                      <th className="py-2.5 px-3">Passenger & Route</th>
                      <th className="py-2.5 px-3">Driver & Status</th>
                      <th className="py-2.5 px-3">Matched Parcel</th>
                      <th className="py-2.5 px-3 text-right">Detour Impact</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Driver Payout</th>
                      <th className="py-2.5 px-3 text-right">Rider Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252b33]/60">
                    {routeMatches.map((m, idx) => {
                      const isSelected = idx === selectedTripIndex;
                      return (
                        <tr
                          key={m.trip.tripId}
                          onClick={() => setSelectedTripIndex(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#252b33]/80 border-l-2 border-[#52b788]' : 'hover:bg-[#1f262e]/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-semibold text-white">{m.trip.tripId}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-white">{m.trip.passenger}</div>
                            <div className="text-[11px] text-[#9ca3af]">
                              {m.trip.origin} &rarr; {m.trip.destination}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-[#d1d5db]">{m.trip.driverName}</div>
                            <div className="text-[10px]">
                              {m.trip.driverOptedIn ? (
                                <span className="text-[#52b788]">Opted-In</span>
                              ) : (
                                <span className="text-red-400">Opted-Out</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-white">{m.parcel.sender}</div>
                            <div className="text-[10px] text-[#9ca3af]">{m.parcel.size}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#d1d5db]">
                            +{m.evaluation.detourMin.toFixed(1)}m ({m.evaluation.detourKm.toFixed(1)}km)
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {m.evaluation.guardrailPassed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#52b788] bg-[#2d6a4f]/20 px-2 py-0.5 rounded border border-[#2d6a4f]/40">
                                <CheckCircle2 className="w-3 h-3" /> MATCHED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                                <XCircle className="w-3 h-3" /> REJECTED
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#52b788]">
                            ₹{m.evaluation.driverIncrementalEarning}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#9ca3af]">
                            ₹{m.evaluation.riderCreditAwarded}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Match Detailed Inspector */}
            {selectedMatch && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#252b33] bg-[#161a20] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#252b33] pb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-[#52b788]" /> Passenger Journey Details
                    </span>
                    <span className="text-xs font-mono text-[#9ca3af]">{selectedMatch.trip.tripId}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#d1d5db]">
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Passenger:</span>
                      <span className="font-semibold text-white">{selectedMatch.trip.passenger}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Route Corridor:</span>
                      <span className="text-right">{selectedMatch.trip.origin} &rarr; {selectedMatch.trip.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Direct Distance & ETA:</span>
                      <span>{selectedMatch.trip.directDistanceKm} km (~{selectedMatch.trip.directEtaMin} mins)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Driver & Vehicle:</span>
                      <span>{selectedMatch.trip.driverName} ({selectedMatch.trip.vehicle})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Driver Opt-in:</span>
                      <span className={selectedMatch.trip.driverOptedIn ? 'text-[#52b788] font-bold' : 'text-red-400 font-bold'}>
                        {selectedMatch.trip.driverOptedIn ? 'Active (Ready for parcel co-trips)' : 'Inactive (Driver declined)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Passenger Delay Guardrail:</span>
                      <span className="text-amber-400 font-semibold">Max +{selectedMatch.trip.maxPassengerDelayMin} mins allowed</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#252b33] bg-[#161a20] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#252b33] pb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#52b788]" /> Matched Parcel & Dispatch Outcome
                    </span>
                    <span className="text-xs font-mono text-[#9ca3af]">{selectedMatch.parcel.parcelId}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#d1d5db]">
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Sender & Type:</span>
                      <span className="font-semibold text-white">{selectedMatch.parcel.sender} ({selectedMatch.parcel.size})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Pickup / Drop:</span>
                      <span className="text-right">{selectedMatch.parcel.pickup} &rarr; {selectedMatch.parcel.dropoff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Delivery Deadline:</span>
                      <span>Within {selectedMatch.parcel.deadlineMin} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Match Verdict:</span>
                      <span className={selectedMatch.evaluation.guardrailPassed ? 'text-[#52b788] font-bold' : 'text-red-400 font-bold'}>
                        {selectedMatch.evaluation.status}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#14181d] border border-[#252b33] text-[11px] text-[#9ca3af] mt-2">
                      <strong className="text-white">Algorithmic Decision:</strong> {selectedMatch.evaluation.reason}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: BUSINESS MODEL COMPARISON */}
        {/* ======================================================== */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-4">
              <div>
                <h3 className="font-semibold text-white text-base">Strategic Comparison: Flat-Fee Alone vs. Flat-Fee + RouteShare</h3>
                <p className="text-xs text-[#9ca3af]">
                  Examining how parcel revenue overlay transforms platform margin stability without extracting commission from passenger fares
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Model A */}
                <div className="p-5 rounded-xl border border-[#252b33] bg-[#14181d] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Model A</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#252b33] text-[#9ca3af]">Pure Subscription</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">Flat-Fee Subscriptions Alone</h4>
                  <p className="text-xs text-[#9ca3af]">
                    Drivers pay a flat ₹{assumptions.flatFeeSubscriptionINR}/month subscription for unlimited ride requests. 0% passenger fare commission.
                  </p>
                  <div className="space-y-2 pt-2 text-xs border-t border-[#252b33]">
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Annual Subscription Revenue:</span>
                      <span className="font-mono font-bold text-white">
                        ₹{((assumptions.activeFleetSize * assumptions.flatFeeSubscriptionINR * 12) / 10000000).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Parcel Delivery Revenue:</span>
                      <span className="font-mono text-[#9ca3af]">₹0.00 Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Driver Incremental Upside:</span>
                      <span className="text-[#9ca3af]">None (restricted to passenger fares)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Monetization Ceiling:</span>
                      <span className="text-amber-400">Fixed strictly by driver fleet count</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Driver Churn Sensitivity:</span>
                      <span className="text-red-400 font-medium">High during low-demand ride hours</span>
                    </div>
                  </div>
                </div>

                {/* Model B */}
                <div className="p-5 rounded-xl border border-[#2d6a4f]/60 bg-[#14181d] space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#52b788] uppercase tracking-wider">Model B (Recommended)</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#2d6a4f]/20 text-[#52b788] border border-[#2d6a4f]/40">
                      Hybrid Value Engine
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white">Flat-Fee + RouteShare Overlay</h4>
                  <p className="text-xs text-[#9ca3af]">
                    Retains the flat driver subscription while unlocking high-margin parcel logistics along co-travel corridors.
                  </p>
                  <div className="space-y-2 pt-2 text-xs border-t border-[#252b33]">
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Annual Subscription Revenue:</span>
                      <span className="font-mono font-bold text-white">
                        ₹{((assumptions.activeFleetSize * assumptions.flatFeeSubscriptionINR * 12) / 10000000).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Incremental Parcel Revenue:</span>
                      <span className="font-mono font-bold text-[#52b788]">
                        +{formatINR(summary.totalRevenueINR)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Driver Incremental Payouts:</span>
                      <span className="font-mono font-bold text-[#52b788]">
                        +{formatINR(summary.totalDriverEarningsINR)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Rider Co-Travel Credits:</span>
                      <span className="font-mono text-[#d1d5db]">
                        {formatINR(summary.totalRiderCreditsINR)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Net Platform Operating Surplus:</span>
                      <span className="font-mono font-bold text-[#52b788]">
                        +{formatINR(summary.totalOperatingProfitINR)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Takeaway Banner */}
              <div className="p-3 rounded-lg bg-[#1f262e] border border-[#252b33] text-xs text-[#9ca3af]">
                <strong className="text-white">Why RouteShare is the Optimal Structure:</strong> Legacy platforms attempt to extract 20–30% take-rates from passenger fares, triggering driver discontent and regulatory caps. RouteShare maintains a driver-friendly flat fee while turning idle vehicular boot space into an incremental cash generator for both drivers and the platform.
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: BUDGET & ROLLOUT ROADMAP */}
        {/* ======================================================== */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            {/* ₹20 Cr Budget Breakdown */}
            <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-4">
              <div className="flex items-center justify-between border-b border-[#252b33] pb-3">
                <div>
                  <h3 className="font-semibold text-white text-base">₹20 Crore Product & Engineering Budget</h3>
                  <p className="text-xs text-[#9ca3af]">Proposed CapEx allocation across engineering, security, and launch operations</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#52b788] bg-[#2d6a4f]/20 px-2.5 py-1 rounded border border-[#2d6a4f]/40">
                  Total: ₹20.00 Cr
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                {CAPEX_BREAKDOWN.map((item) => (
                  <div key={item.pillar} className="p-3.5 rounded-lg border border-[#252b33] bg-[#14181d] space-y-2">
                    <div className="text-xs text-[#9ca3af] font-medium leading-tight h-8 flex items-center">
                      {item.pillar}
                    </div>
                    <div className="text-xl font-bold font-mono text-white">₹{item.crores.toFixed(1)} Cr</div>
                    <div className="w-full h-1.5 rounded-full bg-[#1f262e] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                    </div>
                    <div className="text-[10px] text-[#6b7280] leading-snug">{item.description}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-[#14181d] border border-[#252b33] text-xs text-[#9ca3af] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#52b788] shrink-0" />
                <span>
                  <strong>Accounting Rule:</strong> Driver streak rewards (₹4/parcel) and rider credits (₹5/parcel) are classified as variable operating costs financed directly from parcel fee cash flows, completely separate from this ₹20 Cr technical CapEx.
                </span>
              </div>
            </div>

            {/* 4-Phase Rollout Roadmap */}
            <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-4">
              <h3 className="font-semibold text-white text-base">12-Month Staged Pilot Roadmap</h3>

              <div className="space-y-3">
                {ROLLOUT_ROADMAP.map((phase) => (
                  <div key={phase.phase} className="p-4 rounded-lg border border-[#252b33] bg-[#14181d] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{phase.phase}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#252b33] text-[#52b788] font-mono">
                          {phase.timeline}
                        </span>
                      </div>
                      <span className="text-xs text-[#9ca3af] font-medium">{phase.status}</span>
                    </div>

                    <ul className="space-y-1 text-xs text-[#9ca3af] list-disc list-inside">
                      {phase.milestones.map((m, idx) => (
                        <li key={idx} className="text-[#d1d5db]">
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: PYTHON / STREAMLIT CODE VIEWER */}
        {/* ======================================================== */}
        {activeTab === 'python' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-[#252b33] bg-[#161a20] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#252b33] pb-3">
                <div>
                  <h3 className="font-semibold text-white text-base">Python & Streamlit Dashboard Source</h3>
                  <p className="text-xs text-[#9ca3af]">
                    Complete runnable Python code with Pandas, Plotly, and Streamlit execution architecture
                  </p>
                </div>
                <div className="text-xs font-mono bg-[#14181d] px-3 py-1.5 rounded border border-[#252b33] text-[#52b788]">
                  streamlit run app.py
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg bg-[#14181d] border border-[#252b33] space-y-2">
                  <div className="font-semibold text-white">How to execute the Streamlit app locally:</div>
                  <pre className="p-3 rounded bg-[#0f1215] text-[#52b788] font-mono text-xs overflow-x-auto">
{`# 1. Install dependencies from requirements.txt
pip install -r requirements.txt

# 2. Launch Streamlit
streamlit run app.py`}
                  </pre>
                </div>

                <div className="p-3.5 rounded-lg bg-[#14181d] border border-[#252b33] space-y-2">
                  <div className="font-semibold text-white">File Architecture in Workspace:</div>
                  <ul className="space-y-1 font-mono text-[#9ca3af] text-[11px]">
                    <li>&bull; <strong className="text-white">app.py</strong> : Streamlit frontend with 6 interactive tabs, Plotly charts, and scenario controls</li>
                    <li>&bull; <strong className="text-white">simulation_engine.py</strong> : Pure Python financial model, 12-month pilot engine, and corridor matcher</li>
                    <li>&bull; <strong className="text-white">requirements.txt</strong> : Python dependencies (streamlit, pandas, plotly, numpy)</li>
                    <li>&bull; <strong className="text-white">README.md</strong> : Investor-pitch documentation, formulas, findings, and regulatory analysis</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#252b33] bg-[#14181d] px-4 lg:px-8 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#6b7280] gap-2">
          <div>
            RouteShare Pilot Simulator &bull; Team VoltEdge &bull; Renaissance 10.0, MNNIT Allahabad
          </div>
          <div>
            Built with React, TypeScript &amp; Python Streamlit Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
