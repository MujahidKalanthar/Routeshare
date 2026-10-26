"""
RouteShare Pilot Simulator - Core Simulation & Financial Engine
Team VoltEdge | Strategy Wiz Finals | Renaissance 10.0, MNNIT Allahabad

This module provides modular, transparent, and auditable financial modeling,
12-month pilot forecasting, sensitivity analysis, and route-matching heuristics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import math
from typing import Dict, List, Tuple, Any

try:
    import pandas as pd
except ImportError:
    pd = None


@dataclass
class SimulationAssumptions:
    """Core financial and operational parameters for RouteShare pilot."""

    # Unit economics per completed parcel (Illustrative report baseline)
    net_parcel_revenue: float = 60.0  # Net of applicable taxes (GST already accounted)
    driver_payout: float = 30.0  # Visible guaranteed payout to opting-in driver
    incremental_ops_cost: float = 12.0  # Cloud dispatch, dynamic insurance rider, OTP verification
    rider_credits: float = 5.0  # Capped credits toward future rides (incentivizes co-travel consent)
    driver_rewards: float = 4.0  # Tiered milestone bonuses & streak rewards
    failure_rate_pct: float = 2.5  # % of dispatched parcels requiring claim/return
    avg_claim_cost: float = 150.0  # Platform liability per failed/damaged delivery

    # Monthly volume and scaling
    initial_monthly_demand: int = 150000  # Month 1 parcel requests in Tier-I city pilot
    monthly_growth_rate_pct: float = 12.0  # Compounding monthly demand growth
    matching_success_rate_pct: float = 78.0  # % of requests successfully paired with an active trip
    driver_opt_in_rate_pct: float = 72.0  # % of matched drivers willing to accept parcel detour

    # Fleet & Subscriptions
    active_fleet_size: int = 25000  # Total registered drivers on flat-fee platform
    flat_fee_subscription_inr: float = 2000.0  # Monthly flat subscription paid by drivers for ride access
    pilot_driver_participation_pct: float = 40.0  # % of fleet opted into RouteShare program

    # Fixed Overheads & Capex
    monthly_fixed_ops_cost: float = 2500000.0  # ₹25 Lakhs/month support, city hub, server operations
    capex_investment_crores: float = 20.0  # ₹20 Crore product, engineering, and rollout budget


def calculate_unit_economics(assumptions: SimulationAssumptions) -> Dict[str, float]:
    """
    Computes strict unit economics per completed parcel.
    Baseline from submitted report:
      Net revenue (₹60) - Driver Payout (₹30) - Incremental Ops (₹12) = ₹18 Before Rewards
      - Rider Credits (₹5) - Driver Rewards (₹4) = ₹9 After Rewards (before failure costs)
    """
    # Expected failure cost per dispatched attempt
    expected_failure_cost = (assumptions.failure_rate_pct / 100.0) * assumptions.avg_claim_cost

    contribution_before_rewards = (
        assumptions.net_parcel_revenue
        - assumptions.driver_payout
        - assumptions.incremental_ops_cost
        - expected_failure_cost
    )

    total_incentives = assumptions.rider_credits + assumptions.driver_rewards

    net_contribution_per_parcel = contribution_before_rewards - total_incentives
    contribution_margin_pct = (
        (net_contribution_per_parcel / assumptions.net_parcel_revenue) * 100.0
        if assumptions.net_parcel_revenue > 0
        else 0.0
    )

    monthly_breakeven_volume = (
        int(math.ceil(assumptions.monthly_fixed_ops_cost / net_contribution_per_parcel))
        if net_contribution_per_parcel > 0
        else float("inf")
    )

    return {
        "net_parcel_revenue": assumptions.net_parcel_revenue,
        "driver_payout": assumptions.driver_payout,
        "incremental_ops_cost": assumptions.incremental_ops_cost,
        "expected_failure_cost": expected_failure_cost,
        "contribution_before_rewards": contribution_before_rewards,
        "rider_credits": assumptions.rider_credits,
        "driver_rewards": assumptions.driver_rewards,
        "total_incentives": total_incentives,
        "net_contribution_per_parcel": net_contribution_per_parcel,
        "contribution_margin_pct": contribution_margin_pct,
        "monthly_breakeven_volume": monthly_breakeven_volume,
    }


def simulate_12_month_pilot(assumptions: SimulationAssumptions) -> pd.DataFrame:
    """
    Simulates a 12-month pilot rollout across a dense Tier-I metro.
    Tracks monthly volume ramp-up, driver capacity, revenue, costs, and cumulative cash flow
    against the ₹20 Crore upfront engineering/product investment.
    """
    unit_econ = calculate_unit_economics(assumptions)
    net_contrib = unit_econ["net_contribution_per_parcel"]
    capex_inr = assumptions.capex_investment_crores * 10000000.0

    records = []
    cumulative_contribution = 0.0
    cumulative_cash_flow = -capex_inr

    current_demand = assumptions.initial_monthly_demand
    growth_rate = assumptions.monthly_growth_rate_pct / 100.0
    match_rate = (assumptions.matching_success_rate_pct / 100.0) * (assumptions.driver_opt_in_rate_pct / 100.0)

    # Driver ramp: participation ramps from 50% of target in M1 to 100% by M6
    participating_drivers_target = assumptions.active_fleet_size * (assumptions.pilot_driver_participation_pct / 100.0)

    for month in range(1, 13):
        # Driver capacity constraint (average capacity ~ 2-3 parcels per driver per day = ~65-90/mo)
        ramp_factor = min(1.0, 0.45 + (month - 1) * 0.1)
        active_route_drivers = int(participating_drivers_target * ramp_factor)
        driver_capacity = active_route_drivers * 75  # 75 parcels/driver/month realistic cap

        potential_matched_parcels = int(current_demand * match_rate)
        completed_parcels = min(potential_matched_parcels, driver_capacity)

        # Revenue and Variable Outlays
        parcel_revenue = completed_parcels * assumptions.net_parcel_revenue
        driver_payouts = completed_parcels * assumptions.driver_payout
        incremental_ops = completed_parcels * assumptions.incremental_ops_cost
        rider_credits_issued = completed_parcels * assumptions.rider_credits
        driver_rewards_paid = completed_parcels * assumptions.driver_rewards
        failure_costs = completed_parcels * unit_econ["expected_failure_cost"]

        monthly_variable_contribution = completed_parcels * net_contrib
        monthly_fixed_costs = assumptions.monthly_fixed_ops_cost
        monthly_net_profit = monthly_variable_contribution - monthly_fixed_costs

        cumulative_contribution += monthly_variable_contribution
        cumulative_cash_flow += monthly_net_profit

        # Driver incremental earnings per month
        avg_monthly_driver_earnings = driver_payouts / active_route_drivers if active_route_drivers > 0 else 0.0

        records.append({
            "Month": f"M{month:02d}",
            "Month_Num": month,
            "Demand_Requests": int(current_demand),
            "Active_Route_Drivers": active_route_drivers,
            "Completed_Parcels": completed_parcels,
            "Parcel_Revenue_INR": parcel_revenue,
            "Driver_Payouts_INR": driver_payouts,
            "Incremental_Ops_INR": incremental_ops,
            "Rider_Credits_INR": rider_credits_issued,
            "Driver_Rewards_INR": driver_rewards_paid,
            "Failure_Claims_INR": failure_costs,
            "Fixed_Ops_Cost_INR": monthly_fixed_costs,
            "Monthly_Contribution_INR": monthly_variable_contribution,
            "Monthly_Net_Profit_INR": monthly_net_profit,
            "Cumulative_Contribution_INR": cumulative_contribution,
            "Cumulative_Cash_Flow_INR": cumulative_cash_flow,
            "Avg_Driver_Incremental_INR": avg_monthly_driver_earnings,
        })

        # Compounding demand growth for next month
        current_demand *= (1.0 + growth_rate)

    if pd is not None:
        return pd.DataFrame(records)
    return records


def calculate_scenario_summary(data: Any, assumptions: SimulationAssumptions) -> Dict[str, float]:
    """Computes headline KPIs from a 12-month simulation dataframe or list of dicts."""
    capex_inr = assumptions.capex_investment_crores * 10000000.0

    if pd is not None and isinstance(data, pd.DataFrame):
        total_parcels = float(data["Completed_Parcels"].sum())
        total_revenue = float(data["Parcel_Revenue_INR"].sum())
        total_driver_earnings = float(data["Driver_Payouts_INR"].sum() + data["Driver_Rewards_INR"].sum())
        total_rider_credits = float(data["Rider_Credits_INR"].sum())
        total_variable_contribution = float(data["Monthly_Contribution_INR"].sum())
        total_fixed_costs = float(data["Fixed_Ops_Cost_INR"].sum())
        total_operating_profit = float(data["Monthly_Net_Profit_INR"].sum())
        ending_cash_flow = float(data["Cumulative_Cash_Flow_INR"].iloc[-1])

        payback_month = None
        recovered_in_12m = False
        for _, row in data.iterrows():
            if row["Cumulative_Cash_Flow_INR"] >= 0:
                payback_month = int(row["Month_Num"])
                recovered_in_12m = True
                break
    else:
        # Standard library list-of-dicts fallback
        total_parcels = sum(r["Completed_Parcels"] for r in data)
        total_revenue = sum(r["Parcel_Revenue_INR"] for r in data)
        total_driver_earnings = sum(r["Driver_Payouts_INR"] + r["Driver_Rewards_INR"] for r in data)
        total_rider_credits = sum(r["Rider_Credits_INR"] for r in data)
        total_variable_contribution = sum(r["Monthly_Contribution_INR"] for r in data)
        total_fixed_costs = sum(r["Fixed_Ops_Cost_INR"] for r in data)
        total_operating_profit = sum(r["Monthly_Net_Profit_INR"] for r in data)
        ending_cash_flow = data[-1]["Cumulative_Cash_Flow_INR"] if data else -capex_inr

        payback_month = None
        recovered_in_12m = False
        for r in data:
            if r["Cumulative_Cash_Flow_INR"] >= 0:
                payback_month = r["Month_Num"]
                recovered_in_12m = True
                break

    capex_recovery_pct = max(0.0, min(100.0, (total_operating_profit / capex_inr) * 100.0))

    return {
        "total_parcels_completed": total_parcels,
        "total_parcel_revenue_inr": total_revenue,
        "total_driver_earnings_inr": total_driver_earnings,
        "total_rider_credits_inr": total_rider_credits,
        "total_variable_contribution_inr": total_variable_contribution,
        "total_fixed_costs_inr": total_fixed_costs,
        "total_operating_profit_inr": total_operating_profit,
        "ending_cash_flow_inr": ending_cash_flow,
        "capex_inr": capex_inr,
        "recovered_in_12m": recovered_in_12m,
        "payback_month": payback_month,
        "capex_recovery_pct": capex_recovery_pct,
    }


def generate_sensitivity_matrix(
    base_assumptions: SimulationAssumptions,
    demand_factors: List[float] = [0.7, 0.85, 1.0, 1.15, 1.3],
    payout_values: List[float] = [22.0, 26.0, 30.0, 34.0, 38.0],
) -> pd.DataFrame:
    """
    Generates a 2D sensitivity matrix of 12-Month Platform Operating Profit (in ₹ Crores)
    varying monthly demand (row) vs. driver payout per parcel (col).
    """
    matrix = []
    for dfactor in demand_factors:
        row_data = {"Demand Scaling": f"{int(dfactor*100)}% ({int(base_assumptions.initial_monthly_demand * dfactor):,}/mo)"}
        for payout in payout_values:
            temp_assumptions = SimulationAssumptions(
                net_parcel_revenue=base_assumptions.net_parcel_revenue,
                driver_payout=payout,
                incremental_ops_cost=base_assumptions.incremental_ops_cost,
                rider_credits=base_assumptions.rider_credits,
                driver_rewards=base_assumptions.driver_rewards,
                failure_rate_pct=base_assumptions.failure_rate_pct,
                avg_claim_cost=base_assumptions.avg_claim_cost,
                initial_monthly_demand=int(base_assumptions.initial_monthly_demand * dfactor),
                monthly_growth_rate_pct=base_assumptions.monthly_growth_rate_pct,
                matching_success_rate_pct=base_assumptions.matching_success_rate_pct,
                driver_opt_in_rate_pct=base_assumptions.driver_opt_in_rate_pct,
                active_fleet_size=base_assumptions.active_fleet_size,
                flat_fee_subscription_inr=base_assumptions.flat_fee_subscription_inr,
                pilot_driver_participation_pct=base_assumptions.pilot_driver_participation_pct,
                monthly_fixed_ops_cost=base_assumptions.monthly_fixed_ops_cost,
                capex_investment_crores=base_assumptions.capex_investment_crores,
            )
            sim_df = simulate_12_month_pilot(temp_assumptions)
            summary = calculate_scenario_summary(sim_df, temp_assumptions)
            op_profit_crores = summary["total_operating_profit_inr"] / 10000000.0
            row_data[f"Payout ₹{int(payout)}"] = round(op_profit_crores, 2)
        matrix.append(row_data)

    if pd is not None:
        return pd.DataFrame(matrix)
    return matrix


# Synthetic corridor dataset for spatial route-matching demonstration
CORRIDOR_DATA = [
    {
        "trip_id": "TRP-8401",
        "passenger": "Ananya Sharma",
        "origin": "Indiranagar 100ft Rd",
        "destination": "Bellandur EcoSpace",
        "direct_distance_km": 11.2,
        "direct_eta_min": 32,
        "max_passenger_delay_min": 6,
        "driver_id": "DRV-509",
        "driver_name": "Rajesh Kumar",
        "vehicle": "WagonR (Clean Boot)",
        "driver_opted_in": True,
    },
    {
        "trip_id": "TRP-8402",
        "passenger": "Vikram Malhotra",
        "origin": "Koramangala 4th Block",
        "destination": "Whitefield ITPL",
        "direct_distance_km": 16.5,
        "direct_eta_min": 44,
        "max_passenger_delay_min": 8,
        "driver_id": "DRV-118",
        "driver_name": "Suresh Gowda",
        "vehicle": "Dzire",
        "driver_opted_in": True,
    },
    {
        "trip_id": "TRP-8403",
        "passenger": "Priya Nambiar",
        "origin": "HSR Layout Sector 1",
        "destination": "Electronic City Phase 1",
        "direct_distance_km": 13.8,
        "direct_eta_min": 28,
        "max_passenger_delay_min": 5,
        "driver_id": "DRV-784",
        "driver_name": "Manoj Verma",
        "vehicle": "Etios",
        "driver_opted_in": False,  # Driver opts out this run
    },
    {
        "trip_id": "TRP-8404",
        "passenger": "Arjun Rao",
        "origin": "Domlur Flyover",
        "destination": "Indiranagar Metro",
        "direct_distance_km": 3.4,
        "direct_eta_min": 14,
        "max_passenger_delay_min": 4,
        "driver_id": "DRV-332",
        "driver_name": "Deepak Patel",
        "vehicle": "Triber",
        "driver_opted_in": True,
    },
    {
        "trip_id": "TRP-8405",
        "passenger": "Neha Deshmukh",
        "origin": "MG Road Brigade",
        "destination": "Marathahalli Bridge",
        "direct_distance_km": 12.0,
        "direct_eta_min": 36,
        "max_passenger_delay_min": 7,
        "driver_id": "DRV-641",
        "driver_name": "Karthik Pillai",
        "vehicle": "Aura",
        "driver_opted_in": True,
    },
]

SYNTHETIC_PARCELS = [
    {
        "parcel_id": "PCL-101",
        "sender": "QuickDoc Labs",
        "pickup": "Indiranagar 12th Main",
        "dropoff": "Kaikondrahalli / Bellandur",
        "size": "Envelope (<0.5 kg)",
        "deadline_min": 60,
        "requires_verification": True,
        "max_detour_allowed_km": 1.2,
    },
    {
        "parcel_id": "PCL-102",
        "sender": "TechGizmo Spares",
        "pickup": "Koramangala Sony Signal",
        "dropoff": "Hoodi / Whitefield Outer",
        "size": "Shoebox (1.8 kg)",
        "deadline_min": 90,
        "requires_verification": True,
        "max_detour_allowed_km": 1.8,
    },
    {
        "parcel_id": "PCL-103",
        "sender": "FabArtisan Crafts",
        "pickup": "Silk Board Junction",
        "dropoff": "Velankani Tech Park (EC)",
        "size": "Backpack (3.2 kg)",
        "deadline_min": 75,
        "requires_verification": False,
        "max_detour_allowed_km": 2.5,
    },
    {
        "parcel_id": "PCL-104",
        "sender": "Express Chemist",
        "pickup": "Ulsoor Lake Road",
        "dropoff": "Hebbal Flyover (Wrong Corridor)",
        "size": "Small Pouch (<0.3 kg)",
        "deadline_min": 40,
        "requires_verification": True,
        "max_detour_allowed_km": 1.0,
    },
    {
        "parcel_id": "PCL-105",
        "sender": "Lawyer Chambers",
        "pickup": "Trinity Circle",
        "dropoff": "Spice Garden / Marathahalli",
        "size": "Legal Docket (<1.0 kg)",
        "deadline_min": 80,
        "requires_verification": True,
        "max_detour_allowed_km": 1.5,
    },
]


def match_synthetic_route(trip: dict, parcel: dict, max_allowed_detour_min: float = 6.0) -> Dict:
    """
    Evaluates algorithmic pairing between a passenger trip and a parcel delivery request.
    Enforces strict guardrails:
    1. Driver opt-in requirement
    2. Spatial corridor alignment & detour threshold
    3. Passenger ETA impact guardrail (max delay threshold)
    4. Delivery deadline satisfaction
    """
    # Guardrail 1: Driver Opt-In
    if not trip["driver_opted_in"]:
        return {
            "status": "REJECTED_DRIVER_OPT_OUT",
            "reason": "Driver opted out of RouteShare parcel requests for this trip.",
            "detour_km": 0.0,
            "detour_min": 0,
            "passenger_delay_min": 0,
            "driver_incremental_earning": 0.0,
            "rider_credit_awarded": 0.0,
            "guardrail_passed": False,
        }

    # Synthetic detour estimation based on corridor heuristics
    # (Matches when origins and destinations share common radial corridors)
    corridor_compatibility = {
        ("TRP-8401", "PCL-101"): {"detour_km": 0.9, "detour_min": 3.8, "feasible": True},
        ("TRP-8402", "PCL-102"): {"detour_km": 1.4, "detour_min": 5.2, "feasible": True},
        ("TRP-8403", "PCL-103"): {"detour_km": 1.1, "detour_min": 4.1, "feasible": True},
        ("TRP-8404", "PCL-104"): {"detour_km": 5.8, "detour_min": 19.5, "feasible": False},  # Detour violation
        ("TRP-8405", "PCL-105"): {"detour_km": 1.2, "detour_min": 4.5, "feasible": True},
    }

    key = (trip["trip_id"], parcel["parcel_id"])
    compat = corridor_compatibility.get(key, {"detour_km": 4.5, "detour_min": 16.0, "feasible": False})

    # Guardrail 2 & 3: Detour & Passenger Delay Guardrail
    if not compat["feasible"] or compat["detour_min"] > max_allowed_detour_min or compat["detour_min"] > trip["max_passenger_delay_min"]:
        return {
            "status": "REJECTED_DETOUR_GUARDRAIL",
            "reason": f"Estimated detour (+{compat['detour_min']:.1f}m / {compat['detour_km']:.1f}km) violates passenger service guardrail (max {min(max_allowed_detour_min, trip['max_passenger_delay_min'])}m).",
            "detour_km": compat["detour_km"],
            "detour_min": compat["detour_min"],
            "passenger_delay_min": compat["detour_min"],
            "driver_incremental_earning": 0.0,
            "rider_credit_awarded": 0.0,
            "guardrail_passed": False,
        }

    # Guardrail 4: Parcel Deadline Check
    total_delivery_time = trip["direct_eta_min"] + compat["detour_min"]
    if total_delivery_time > parcel["deadline_min"]:
        return {
            "status": "REJECTED_DEADLINE_VIOLATION",
            "reason": f"Projected delivery ETA ({total_delivery_time:.0f}m) exceeds parcel deadline ({parcel['deadline_min']}m).",
            "detour_km": compat["detour_km"],
            "detour_min": compat["detour_min"],
            "passenger_delay_min": compat["detour_min"],
            "driver_incremental_earning": 0.0,
            "rider_credit_awarded": 0.0,
            "guardrail_passed": False,
        }

    # Successful Match
    return {
        "status": "MATCHED_SUCCESS",
        "reason": f"Optimal match! Detour +{compat['detour_min']:.1f}m within passenger tolerance (+{trip['max_passenger_delay_min']}m).",
        "detour_km": compat["detour_km"],
        "detour_min": compat["detour_min"],
        "passenger_delay_min": compat["detour_min"],
        "driver_incremental_earning": 30.0,  # Base payout
        "rider_credit_awarded": 5.0,  # Credit toward co-traveler
        "guardrail_passed": True,
    }
