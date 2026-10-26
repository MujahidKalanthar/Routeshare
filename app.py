"""
RouteShare Pilot Simulator
Team VoltEdge | Strategy Wiz Finals | Renaissance 10.0, MNNIT Allahabad

Run with:
    streamlit run app.py
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px

from simulation_engine import (
    SimulationAssumptions,
    calculate_unit_economics,
    simulate_12_month_pilot,
    calculate_scenario_summary,
    generate_sensitivity_matrix,
    CORRIDOR_DATA,
    SYNTHETIC_PARCELS,
    match_synthetic_route,
)

# ---------------------------------------------------------
# Page Configuration & Styling (Restrained Charcoal Palette)
# ---------------------------------------------------------
st.set_page_config(
    page_title="RouteShare Pilot Simulator | Team VoltEdge",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for executive presentation aesthetic
st.markdown("""
<style>
    /* Dark charcoal and muted green accents */
    .stApp {
        background-color: #0f1215;
        color: #e5e7eb;
    }
    .metric-card {
        background-color: #171b20;
        border: 1px solid #252b33;
        border-radius: 8px;
        padding: 16px 20px;
        margin-bottom: 12px;
    }
    .metric-value {
        font-size: 26px;
        font-weight: 700;
        color: #f3f4f6;
    }
    .metric-sub {
        font-size: 13px;
        color: #9ca3af;
    }
    .pill-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 2px 8px;
        border-radius: 4px;
        background: rgba(56, 176, 0, 0.15);
        color: #52b788;
        border: 1px solid rgba(82, 183, 136, 0.3);
    }
    .disclaimer-box {
        background-color: #1a1e24;
        border-left: 3px solid #eab308;
        padding: 10px 16px;
        border-radius: 0 6px 6px 0;
        margin-bottom: 16px;
        font-size: 12px;
        color: #d1d5db;
    }
    .scenario-btn {
        margin-right: 8px;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Sidebar: Scenarios & Assumption Adjustments
# ---------------------------------------------------------
st.sidebar.markdown("### ⚙️ Scenario Presets")
scenario_choice = st.sidebar.radio(
    "Select Strategic Scenario",
    ["Base Case (Report Baseline)", "Conservative Stress Test", "Optimistic Fast-Ramp", "Custom Parameters"],
    index=0
)

# Define baseline values depending on preset
if scenario_choice == "Conservative Stress Test":
    default_demand = 90000
    default_growth = 7.0
    default_rev = 55.0
    default_payout = 32.0
    default_ops = 14.0
    default_rider_credits = 6.0
    default_driver_rewards = 4.0
    default_failure_rate = 3.5
    default_matching_rate = 65.0
elif scenario_choice == "Optimistic Fast-Ramp":
    default_demand = 220000
    default_growth = 18.0
    default_rev = 65.0
    default_payout = 28.0
    default_ops = 10.0
    default_rider_credits = 4.0
    default_driver_rewards = 4.0
    default_failure_rate = 1.8
    default_matching_rate = 85.0
else:
    # Base Case (Report Baseline)
    default_demand = 150000
    default_growth = 12.0
    default_rev = 60.0
    default_payout = 30.0
    default_ops = 12.0
    default_rider_credits = 5.0
    default_driver_rewards = 4.0
    default_failure_rate = 2.5
    default_matching_rate = 78.0

st.sidebar.markdown("---")
st.sidebar.markdown("### 🎛️ Unit Economics Assumptions")
net_parcel_rev = st.sidebar.slider(
    "Net Parcel Fee (₹ after taxes)",
    min_value=40.0, max_value=100.0, value=float(default_rev), step=1.0,
    help="Net fee collected per delivery after GST. Baseline: ₹60."
)
driver_payout = st.sidebar.slider(
    "Driver Payout per Parcel (₹)",
    min_value=15.0, max_value=50.0, value=float(default_payout), step=1.0,
    help="Direct visible compensation to the driver for completing the parcel delivery. Baseline: ₹30."
)
incremental_ops = st.sidebar.slider(
    "Incremental Ops Cost per Parcel (₹)",
    min_value=5.0, max_value=25.0, value=float(default_ops), step=0.5,
    help="Variable cloud dispatching, parcel micro-insurance, and SMS/OTP verification. Baseline: ₹12."
)
rider_credits = st.sidebar.slider(
    "Rider Credits per Parcel (₹)",
    min_value=0.0, max_value=15.0, value=float(default_rider_credits), step=0.5,
    help="Ride-hailing passenger compensation credits for consenting to the stop. Baseline: ₹5."
)
driver_rewards = st.sidebar.slider(
    "Driver Rewards / Streaks (₹)",
    min_value=0.0, max_value=15.0, value=float(default_driver_rewards), step=0.5,
    help="Volume milestone bonuses and punctuality incentives. Baseline: ₹4."
)
failure_rate = st.sidebar.slider(
    "Delivery Failure / Return Rate (%)",
    min_value=0.5, max_value=8.0, value=float(default_failure_rate), step=0.1,
    help="Parcels returned or damaged requiring refund/re-routing. Baseline: 2.5%."
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 📈 Pilot Scale & Market Assumptions")
initial_demand = st.sidebar.number_input(
    "Initial Monthly Demand (Month 1)",
    min_value=20000, max_value=600000, value=int(default_demand), step=10000
)
demand_growth = st.sidebar.slider(
    "Monthly Demand Growth (%)",
    min_value=2.0, max_value=30.0, value=float(default_growth), step=0.5
)
matching_success = st.sidebar.slider(
    "Corridor Match Success Rate (%)",
    min_value=40.0, max_value=95.0, value=float(default_matching_rate), step=1.0,
    help="Percentage of parcel requests aligned with an active passenger route within detour tolerance."
)
driver_opt_in = st.sidebar.slider(
    "Driver Opt-in Acceptance Rate (%)",
    min_value=30.0, max_value=95.0, value=72.0, step=1.0,
    help="Percentage of drivers on matched routes who accept the parcel pickup request."
)
fixed_ops_cost_lakhs = st.sidebar.number_input(
    "Fixed Monthly Operations (₹ Lakhs)",
    min_value=5.0, max_value=100.0, value=25.0, step=2.5,
    help="City operations, hub personnel, customer support overhead. ₹25L/month default."
)
capex_crores = st.sidebar.number_input(
    "Product & Eng. CapEx (₹ Crores)",
    min_value=5.0, max_value=50.0, value=20.0, step=1.0,
    help="Upfront budget for route integration, app UX, fraud security, testing and launch."
)

# Instantiate assumptions
assumptions = SimulationAssumptions(
    net_parcel_revenue=net_parcel_rev,
    driver_payout=driver_payout,
    incremental_ops_cost=incremental_ops,
    rider_credits=rider_credits,
    driver_rewards=driver_rewards,
    failure_rate_pct=failure_rate,
    avg_claim_cost=150.0,
    initial_monthly_demand=int(initial_demand),
    monthly_growth_rate_pct=demand_growth,
    matching_success_rate_pct=matching_success,
    driver_opt_in_rate_pct=driver_opt_in,
    active_fleet_size=25000,
    flat_fee_subscription_inr=2000.0,
    pilot_driver_participation_pct=40.0,
    monthly_fixed_ops_cost=fixed_ops_cost_lakhs * 100000.0,
    capex_investment_crores=capex_crores,
)

# Run core engine
unit_econ = calculate_unit_economics(assumptions)
sim_df = simulate_12_month_pilot(assumptions)
summary = calculate_scenario_summary(sim_df, assumptions)

# ---------------------------------------------------------
# Header & Context
# ---------------------------------------------------------
st.markdown("""
<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #252b33; padding-bottom:12px; margin-bottom:16px;">
    <div>
        <h1 style="margin:0; font-size:28px; font-weight:800; color:#f3f4f6;">RouteShare Pilot Simulator</h1>
        <p style="margin:4px 0 0 0; font-size:14px; color:#9ca3af;">
            Team VoltEdge | Strategy Wiz Finals | Renaissance 10.0, MNNIT Allahabad
        </p>
    </div>
    <div style="text-align:right;">
        <span class="pill-badge">Tier-I Metro Pilot Model</span>
        <div style="font-size:12px; color:#9ca3af; margin-top:4px;">12-Month Projections</div>
    </div>
</div>
""", unsafe_allow_html=True)

st.markdown("""
<div class="disclaimer-box">
    <strong>⚠️ Model Transparency Notice:</strong> All figures presented herein are derived from simulation hypotheses and the illustrative starting assumptions submitted in Team VoltEdge's report (₹60 Net Revenue, ₹30 Driver Payout, ₹12 Ops, ₹5 Rider Credits, ₹4 Driver Rewards). They do not represent verified historical operating data or regulatory certification.
</div>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Tabbed Navigation
# ---------------------------------------------------------
tabs = st.tabs([
    "📊 Executive Dashboard",
    "🧮 Unit Economics",
    "📈 12-Month Pilot Simulation",
    "🗺️ Route-Matching Simulation",
    "⚖️ Business Model Comparison",
    "🏛️ Budget & Rollout Roadmap",
])

# ---------------------------------------------------------
# TAB 1: EXECUTIVE DASHBOARD
# ---------------------------------------------------------
with tabs[0]:
    st.subheader("Pilot Performance Overview (12-Month Aggregate)")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-sub">Total Parcels Completed</div>
            <div class="metric-value">{summary['total_parcels_completed']:,}</div>
            <div class="metric-sub" style="color:#52b788;">From {sim_df['Demand_Requests'].sum():,} requests</div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-sub">Gross Parcel Revenue</div>
            <div class="metric-value">₹{summary['total_parcel_revenue_inr']/10000000:.2f} Cr</div>
            <div class="metric-sub">Net of GST @ ₹{assumptions.net_parcel_revenue:.0f}/parcel</div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-sub">Variable Contribution</div>
            <div class="metric-value" style="color:#52b788;">₹{summary['total_variable_contribution_inr']/10000000:.2f} Cr</div>
            <div class="metric-sub">{unit_econ['contribution_margin_pct']:.1f}% Contribution Margin</div>
        </div>
        """, unsafe_allow_html=True)

    with col4:
        op_profit_cr = summary['total_operating_profit_inr'] / 10000000.0
        color = "#52b788" if op_profit_cr > 0 else "#ef4444"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-sub">12-Month Operating Profit</div>
            <div class="metric-value" style="color:{color};">₹{op_profit_cr:.2f} Cr</div>
            <div class="metric-sub">After ₹{summary['total_fixed_costs']/10000000:.2f} Cr Fixed Ops</div>
        </div>
        """, unsafe_allow_html=True)

    col5, col6, col7, col8 = st.columns(4)
    with col5:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-sub">Driver Incremental Payouts</div>
            <div class="metric-value" style="color:#38b000;">₹{summary['total_driver_earnings_inr']/10000000:.2f} Cr</div>
            <div class="metric-sub">~₹{summary['total_driver_earnings_inr'] / max(1, sim_df['Active_Route_Drivers'].iloc[-1]):,.0f}/driver annually</div>
        </div>
        """, unsafe_allow_html=True)

    with col6:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-sub">Rider Credits Issued</div>
            <div class="metric-value">₹{summary['total_rider_credits_inr']/10000000:.2f} Cr</div>
            <div class="metric-sub">Capped @ ₹{assumptions.rider_credits:.0f}/parcel trip</div>
        </div>
        """, unsafe_allow_html=True)

    with col7:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-sub">Delivery Completion Rate</div>
            <div class="metric-value">{100.0 - assumptions.failure_rate_pct:.1f}%</div>
            <div class="metric-sub">Claim cost: ₹{assumptions.avg_claim_cost:.0f} per fail</div>
        </div>
        """, unsafe_allow_html=True)

    with col8:
        capex_status = "RECOVERED" if summary['recovered_in_12m'] else "UNRECOVERED"
        badge_color = "#52b788" if summary['recovered_in_12m'] else "#f59e0b"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-sub">₹20 Cr CapEx Status</div>
            <div class="metric-value" style="color:{badge_color};">{capex_status}</div>
            <div class="metric-sub">{summary['capex_recovery_pct']:.1f}% recovered in 12M</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")

    # High-level summary visual
    chart_col1, chart_col2 = st.columns([3, 2])
    with chart_col1:
        st.markdown("#### Monthly Volume Ramp & Platform Operating Trajectory")
        fig_vol = go.Figure()
        fig_vol.add_trace(go.Bar(
            x=sim_df["Month"],
            y=sim_df["Completed_Parcels"] / 1000.0,
            name="Completed Parcels ('000s)",
            marker_color="#2d6a4f",
            yaxis="y1",
        ))
        fig_vol.add_trace(go.Scatter(
            x=sim_df["Month"],
            y=sim_df["Monthly_Net_Profit_INR"] / 100000.0,
            name="Monthly Net Operating Profit (₹ Lakhs)",
            line=dict(color="#52b788", width=3),
            yaxis="y2",
        ))
        fig_vol.update_layout(
            paper_bgcolor="#171b20",
            plot_bgcolor="#171b20",
            font_color="#d1d5db",
            margin=dict(l=40, r=40, t=30, b=40),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            yaxis=dict(title="Completed Parcels (Thousands)", showgrid=False),
            yaxis2=dict(title="Monthly Profit (₹ Lakhs)", overlaying="y", side="right", showgrid=True, gridcolor="#252b33"),
            hovermode="x unified",
        )
        st.plotly_chart(fig_vol, use_container_width=True)

    with chart_col2:
        st.markdown("#### Service Impact & Guardrail Compliance")
        st.markdown("""
        - **Passenger ETA Impact:** Strict heuristic cap prevents matches exceeding **5-8 min** detour.
        - **Opt-In Visibility:** Drivers see full pickup location and guaranteed payout before accepting.
        - **Zero Percentage Cut:** Platform takes **₹0 cut** from passenger fare; earnings arise strictly from parcel fee surplus.
        - **Rider Goodwill:** Co-travelers receive capped ride credits, turning potential minor inconvenience into loyalty retention.
        """)
        fig_gauges = go.Figure(go.Indicator(
            mode="gauge+number",
            value=unit_econ['contribution_margin_pct'],
            title={'text': "Parcel Contribution Margin (%)", 'font': {'size': 14, 'color': '#d1d5db'}},
            gauge={
                'axis': {'range': [0, 40], 'tickcolor': "#9ca3af"},
                'bar': {'color': "#52b788"},
                'steps': [
                    {'range': [0, 10], 'color': "#374151"},
                    {'range': [10, 25], 'color': "#1f2937"},
                    {'range': [25, 40], 'color': "#111827"},
                ],
                'threshold': {
                    'line': {'color': "#eab308", 'width': 3},
                    'thickness': 0.75,
                    'value': 15.0
                }
            }
        ))
        fig_gauges.update_layout(
            paper_bgcolor="#171b20",
            font_color="#d1d5db",
            margin=dict(l=20, r=20, t=40, b=20),
            height=250,
        )
        st.plotly_chart(fig_gauges, use_container_width=True)

# ---------------------------------------------------------
# TAB 2: UNIT ECONOMICS CALCULATOR
# ---------------------------------------------------------
with tabs[1]:
    st.subheader("Auditable Unit Economics Breakdown")
    st.markdown("Consistent single-parcel revenue and expense waterfall following the submitted strategy document.")

    u_col1, u_col2 = st.columns([3, 2])
    with u_col1:
        # Waterfall Chart
        fig_wf = go.Figure(go.Waterfall(
            name="Unit Waterfall",
            orientation="v",
            measure=["absolute", "relative", "relative", "relative", "total", "relative", "relative", "total"],
            x=[
                "Net Parcel Fee",
                "Driver Payout",
                "Incremental Ops",
                "Failure Risk",
                "Contrib Pre-Rewards",
                "Rider Credits",
                "Driver Rewards",
                "Net Contribution",
            ],
            y=[
                unit_econ["net_parcel_revenue"],
                -unit_econ["driver_payout"],
                -unit_econ["incremental_ops_cost"],
                -unit_econ["expected_failure_cost"],
                0,
                -unit_econ["rider_credits"],
                -unit_econ["driver_rewards"],
                0,
            ],
            connector={"line": {"color": "#4b5563"}},
            decreasing={"marker": {"color": "#ef4444"}},
            increasing={"marker": {"color": "#52b788"}},
            totals={"marker": {"color": "#38b000"}},
        ))
        fig_wf.update_layout(
            title="Per-Parcel Cash Inflow & Outflow Waterfall (₹)",
            paper_bgcolor="#171b20",
            plot_bgcolor="#171b20",
            font_color="#d1d5db",
            margin=dict(l=30, r=30, t=50, b=30),
            yaxis=dict(title="INR (₹)", gridcolor="#252b33"),
        )
        st.plotly_chart(fig_wf, use_container_width=True)

    with u_col2:
        st.markdown("#### Audit Table (Per Completed Parcel)")
        audit_data = [
            ("Gross Parcel Charge (Net of Taxes)", f"₹{unit_econ['net_parcel_revenue']:.2f}", "Entered net of GST"),
            ("(-) Driver Direct Payout", f"-₹{unit_econ['driver_payout']:.2f}", "Guaranteed driver incentive"),
            ("(-) Incremental Ops & Dispatch", f"-₹{unit_econ['incremental_ops_cost']:.2f}", "Cloud, SMS, micro-insurance"),
            ("(-) Expected Failure Claims", f"-₹{unit_econ['expected_failure_cost']:.2f}", f"{assumptions.failure_rate_pct}% @ ₹{assumptions.avg_claim_cost}"),
            ("(=) Contribution Before Rewards", f"₹{unit_econ['contribution_before_rewards']:.2f}", "Submitted baseline: ₹18.00"),
            ("(-) Rider Co-Travel Credits", f"-₹{unit_econ['rider_credits']:.2f}", "Capped ride discounts"),
            ("(-) Driver Streak Rewards", f"-₹{unit_econ['driver_rewards']:.2f}", "Volume streak incentives"),
            ("(=) Net Unit Contribution", f"₹{unit_econ['net_contribution_per_parcel']:.2f}", "Submitted baseline: ₹9.00"),
            ("Contribution Margin", f"{unit_econ['contribution_margin_pct']:.2f}%", "% of Net Revenue"),
            ("Monthly Break-Even Volume", f"{unit_econ['monthly_breakeven_volume']:,} parcels", "To cover ₹25L fixed overhead"),
        ]
        audit_df = pd.DataFrame(audit_data, columns=["Item", "Value", "Description"])
        st.table(audit_df)

    st.markdown("---")
    st.markdown("#### 🚨 Sensitivity Check: Break-Even & Investment Viability")
    if unit_econ["net_contribution_per_parcel"] <= 0:
        st.error("⚠️ Negative Unit Contribution: At these input costs, each completed parcel loses money! The platform cannot reach break-even.")
    else:
        st.success(
            f"✅ Positive Unit Contribution: ₹{unit_econ['net_contribution_per_parcel']:.2f} per parcel. "
            f"The platform covers its ₹{assumptions.monthly_fixed_ops_cost/100000:.1f} Lakhs monthly fixed operations once monthly volume exceeds "
            f"**{unit_econ['monthly_breakeven_volume']:,} parcels** (~{int(unit_econ['monthly_breakeven_volume']/30):,} parcels/day across the metro fleet)."
        )

# ---------------------------------------------------------
# TAB 3: 12-MONTH PILOT SIMULATION
# ---------------------------------------------------------
with tabs[2]:
    st.subheader("12-Month Pilot Simulation & Cash Flow Trajectory")
    st.markdown("Tracking volume scaling, monthly contribution, overheads, and payback against the upfront ₹20 Crore CapEx.")

    # Cash flow cumulative chart
    fig_cf = go.Figure()
    fig_cf.add_trace(go.Scatter(
        x=sim_df["Month"],
        y=sim_df["Cumulative_Cash_Flow_INR"] / 10000000.0,
        mode="lines+markers",
        name="Cumulative Cash Flow (₹ Cr)",
        line=dict(color="#52b788", width=3),
        marker=dict(size=7),
    ))
    fig_cf.add_hline(
        y=0,
        line_dash="dash",
        line_color="#eab308",
        annotation_text="₹20 Cr CapEx Break-Even Line",
        annotation_position="bottom right",
    )
    fig_cf.update_layout(
        title="Cumulative Cash Flow Trajectory vs. ₹20 Crore Investment",
        paper_bgcolor="#171b20",
        plot_bgcolor="#171b20",
        font_color="#d1d5db",
        yaxis=dict(title="Net Cash Position (₹ Crores)", gridcolor="#252b33"),
        xaxis=dict(title="Pilot Month"),
        hovermode="x unified",
        margin=dict(l=40, r=40, t=50, b=40),
    )
    st.plotly_chart(fig_cf, use_container_width=True)

    # Monthly breakdown table
    st.markdown("#### Monthly Operational Breakdown")
    display_sim_df = sim_df.copy()
    display_sim_df["Demand"] = display_sim_df["Demand_Requests"].map("{:,}".format)
    display_sim_df["Completed"] = display_sim_df["Completed_Parcels"].map("{:,}".format)
    display_sim_df["Drivers"] = display_sim_df["Active_Route_Drivers"].map("{:,}".format)
    display_sim_df["Revenue (₹ Lakh)"] = (display_sim_df["Parcel_Revenue_INR"] / 100000.0).map("{:,.1f}".format)
    display_sim_df["Driver Pay (₹ Lakh)"] = (display_sim_df["Driver_Payouts_INR"] / 100000.0).map("{:,.1f}".format)
    display_sim_df["Contribution (₹ Lakh)"] = (display_sim_df["Monthly_Contribution_INR"] / 100000.0).map("{:,.1f}".format)
    display_sim_df["Net Profit (₹ Lakh)"] = (display_sim_df["Monthly_Net_Profit_INR"] / 100000.0).map("{:,.1f}".format)
    display_sim_df["Cum Cash Flow (₹ Cr)"] = (display_sim_df["Cumulative_Cash_Flow_INR"] / 10000000.0).map("{:,.2f}".format)

    cols_to_show = ["Month", "Demand", "Drivers", "Completed", "Revenue (₹ Lakh)", "Driver Pay (₹ Lakh)", "Contribution (₹ Lakh)", "Net Profit (₹ Lakh)", "Cum Cash Flow (₹ Cr)"]
    st.dataframe(display_sim_df[cols_to_show], use_container_width=True)

    # Sensitivity Table Matrix
    st.markdown("#### 2-Way Sensitivity Matrix: 12-Month Operating Profit (₹ Crores)")
    st.caption("Testing vulnerability to parcel demand variations (rows) against driver payout per parcel (columns).")
    sens_matrix = generate_sensitivity_matrix(assumptions)
    st.dataframe(sens_matrix, use_container_width=True)

# ---------------------------------------------------------
# TAB 4: ROUTE-MATCHING SIMULATION
# ---------------------------------------------------------
with tabs[3]:
    st.subheader("Algorithmic Route-Matching Simulation")
    st.markdown(
        "Demonstrates how RouteShare pairs passenger journeys with suitable small parcel dispatches along "
        "dense Tier-I commuter corridors (e.g. Bangalore Outer Ring Rd / Koramangala / Whitefield)."
    )

    detour_tolerance = st.slider(
        "Maximum Permitted Passenger Detour (Minutes)",
        min_value=2.0, max_value=12.0, value=6.0, step=0.5,
        help="Algorithmic guardrail: Trips requiring a detour higher than this threshold are rejected to safeguard passenger ETA."
    )

    st.markdown("#### Active Trips & Synthetic Parcel Queue")
    match_results = []
    for i in range(len(CORRIDOR_DATA)):
        trip = CORRIDOR_DATA[i]
        parcel = SYNTHETIC_PARCELS[i]
        res = match_synthetic_route(trip, parcel, max_allowed_detour_min=detour_tolerance)
        match_results.append({
            "Trip ID": trip["trip_id"],
            "Passenger Route": f"{trip['origin']} ➔ {trip['destination']}",
            "Driver": f"{trip['driver_name']} ({'Opted In' if trip['driver_opted_in'] else 'Opted Out'})",
            "Parcel ID": parcel["parcel_id"],
            "Parcel Consignment": f"{parcel['sender']} ({parcel['size']})",
            "Detour Impact": f"+{res['detour_min']:.1f} min ({res['detour_km']:.1f} km)",
            "Status": "✅ MATCHED" if res["guardrail_passed"] else f"❌ {res['status']}",
            "Driver Payout": f"₹{res['driver_incremental_earning']:.0f}",
            "Rider Credit": f"₹{res['rider_credit_awarded']:.0f}",
            "Explanation": res["reason"],
        })

    match_df = pd.DataFrame(match_results)
    st.dataframe(match_df[["Trip ID", "Passenger Route", "Driver", "Parcel Consignment", "Detour Impact", "Status", "Driver Payout", "Rider Credit"]], use_container_width=True)

    st.markdown("#### Deep-Dive Match Inspection")
    selected_idx = st.selectbox(
        "Select Trip to Inspect Matching Guardrails",
        range(len(CORRIDOR_DATA)),
        format_func=lambda x: f"{CORRIDOR_DATA[x]['trip_id']} : {CORRIDOR_DATA[x]['origin']} ➔ {CORRIDOR_DATA[x]['destination']}"
    )

    selected_trip = CORRIDOR_DATA[selected_idx]
    selected_parcel = SYNTHETIC_PARCELS[selected_idx]
    eval_res = match_synthetic_route(selected_trip, selected_parcel, max_allowed_detour_min=detour_tolerance)

    c_m1, c_m2 = st.columns(2)
    with c_m1:
        st.markdown(f"""
        <div class="metric-card">
            <h4>🚘 Passenger Trip: {selected_trip['trip_id']}</h4>
            <p><strong>Rider:</strong> {selected_trip['passenger']}</p>
            <p><strong>Route:</strong> {selected_trip['origin']} to {selected_trip['destination']}</p>
            <p><strong>Direct Distance:</strong> {selected_trip['direct_distance_km']} km (~{selected_trip['direct_eta_min']} mins)</p>
            <p><strong>Driver:</strong> {selected_trip['driver_name']} | <strong>Opt-in:</strong> {'Yes' if selected_trip['driver_opted_in'] else 'No'}</p>
            <p><strong>Passenger Max Tolerated Delay:</strong> {selected_trip['max_passenger_delay_min']} mins</p>
        </div>
        """, unsafe_allow_html=True)

    with c_m2:
        status_color = "#52b788" if eval_res["guardrail_passed"] else "#ef4444"
        st.markdown(f"""
        <div class="metric-card">
            <h4>📦 Matched Parcel: {selected_parcel['parcel_id']}</h4>
            <p><strong>Sender:</strong> {selected_parcel['sender']} ({selected_parcel['size']})</p>
            <p><strong>Pickup / Drop:</strong> {selected_parcel['pickup']} ➔ {selected_parcel['dropoff']}</p>
            <p><strong>Delivery Deadline:</strong> Within {selected_parcel['deadline_min']} mins</p>
            <p><strong>Match Outcome:</strong> <span style="color:{status_color}; font-weight:700;">{eval_res['status']}</span></p>
            <p><strong>Reasoning:</strong> {eval_res['reason']}</p>
        </div>
        """, unsafe_allow_html=True)

# ---------------------------------------------------------
# TAB 5: BUSINESS MODEL COMPARISON
# ---------------------------------------------------------
with tabs[4]:
    st.subheader("Business Model Comparison: Subscriptions vs. RouteShare Overlay")
    st.markdown(
        "Evaluating the financial posture of a pure Flat-Fee Driver Subscription platform (Model A) "
        "versus Flat-Fee Subscriptions with the RouteShare parcel revenue overlay (Model B)."
    )

    # 12-Month comparison
    drivers = assumptions.active_fleet_size
    sub_fee = assumptions.flat_fee_subscription_inr
    annual_subs_rev = drivers * sub_fee * 12

    # In Model A (Pure Subs), platform has baseline churn (say 18% annual driver turnover)
    # In Model B (Subs + RouteShare), driver incremental earnings reduce churn, increasing lifetime value
    parcel_contrib_annual = summary["total_variable_contribution_inr"]
    routeshare_fixed_cost = summary["total_fixed_costs"]

    comp_col1, comp_col2 = st.columns(2)
    with comp_col1:
        st.markdown("""
        <div class="metric-card">
            <h3>Model A: Flat-Fee Subscriptions Alone</h3>
            <p style="color:#9ca3af;">Drivers pay ₹2,000/mo flat subscription. Zero percentage fare cuts.</p>
            <hr style="border-color:#252b33;"/>
            <p><strong>Annual Subscription Revenue:</strong> ₹{:.2f} Cr</p>
            <p><strong>Parcel Logistics Revenue:</strong> ₹0.00 Cr</p>
            <p><strong>Driver Incremental Upside:</strong> None (Dependent purely on passenger trips)</p>
            <p><strong>Platform Monetization Ceiling:</strong> Capped strictly by active driver count</p>
            <p><strong>Driver Churn Risk:</strong> High when passenger demand fluctuates</p>
        </div>
        """.format(annual_subs_rev / 10000000.0), unsafe_allow_html=True)

    with comp_col2:
        st.markdown("""
        <div class="metric-card" style="border:1px solid #52b788;">
            <h3>Model B: Subscriptions + RouteShare</h3>
            <p style="color:#52b788;">Flat subscription maintained + dynamic parcel matching on co-travel routes.</p>
            <hr style="border-color:#252b33;"/>
            <p><strong>Annual Subscription Revenue:</strong> ₹{:.2f} Cr</p>
            <p><strong>Incremental Parcel Revenue:</strong> +₹{:.2f} Cr</p>
            <p><strong>Driver Incremental Earnings:</strong> +₹{:.2f} Cr paid directly to drivers</p>
            <p><strong>Rider Credits Distributed:</strong> ₹{:.2f} Cr returned to passengers</p>
            <p><strong>Net Operating Contribution:</strong> +₹{:.2f} Cr added to platform</p>
        </div>
        """.format(
            annual_subs_rev / 10000000.0,
            summary["total_parcel_revenue_inr"] / 10000000.0,
            summary["total_driver_earnings_inr"] / 10000000.0,
            summary["total_rider_credits_inr"] / 10000000.0,
            summary["total_operating_profit_inr"] / 10000000.0,
        ), unsafe_allow_html=True)

    # Comparison chart
    fig_comp = go.Figure()
    fig_comp.add_trace(go.Bar(
        name="Model A: Pure Flat-Fee",
        x=["Platform Revenue", "Driver Earnings Pool", "Net Operating Margin"],
        y=[annual_subs_rev / 10000000.0, (annual_subs_rev * 0.1) / 10000000.0, (annual_subs_rev * 0.25) / 10000000.0],
        marker_color="#4b5563"
    ))
    fig_comp.add_trace(go.Bar(
        name="Model B: Flat-Fee + RouteShare",
        x=["Platform Revenue", "Driver Earnings Pool", "Net Operating Margin"],
        y=[
            (annual_subs_rev + summary["total_parcel_revenue_inr"]) / 10000000.0,
            ((annual_subs_rev * 0.1) + summary["total_driver_earnings_inr"]) / 10000000.0,
            ((annual_subs_rev * 0.25) + summary["total_operating_profit_inr"]) / 10000000.0,
        ],
        marker_color="#52b788"
    ))
    fig_comp.update_layout(
        barmode="group",
        title="Financial Outcome Comparison (₹ Crores)",
        paper_bgcolor="#171b20",
        plot_bgcolor="#171b20",
        font_color="#d1d5db",
        yaxis=dict(title="INR Crores", gridcolor="#252b33"),
    )
    st.plotly_chart(fig_comp, use_container_width=True)

# ---------------------------------------------------------
# TAB 6: BUDGET & ROLLOUT ROADMAP
# ---------------------------------------------------------
with tabs[5]:
    st.subheader("₹20 Crore Product/Engineering CapEx & Rollout Architecture")
    st.markdown("Explicit breakdown of the proposed capital deployment and the 4-phase 12-month pilot roadmap.")

    b_col1, b_col2 = st.columns(2)
    with b_col1:
        budget_items = [
            {"Pillar": "Matching & Route Integration Engine", "Budget_Cr": 5.0, "Share_Pct": 25.0, "Description": "Spatial indexation, detour bounding box heuristics, corridor clustering"},
            {"Pillar": "Rider & Driver App UX Overhaul", "Budget_Cr": 4.0, "Share_Pct": 20.0, "Description": "Opt-in transparency toggles, boot-space declaration, parcel OTP flow"},
            {"Pillar": "Credits, Pass & Ledger Engine", "Budget_Cr": 3.0, "Share_Pct": 15.0, "Description": "Dynamic rider wallet credit issuance, driver instant payout ledger"},
            {"Pillar": "Data, Security & Fraud Prevention", "Budget_Cr": 4.0, "Share_Pct": 20.0, "Description": "Consignment photo verification, tamper bags, lost/damage claim audit"},
            {"Pillar": "Staged Testing & Controlled Launch", "Budget_Cr": 4.0, "Share_Pct": 20.0, "Description": "End-to-end sandbox simulation, dry runs with 500 test drivers in corridor pilot"},
        ]
        b_df = pd.DataFrame(budget_items)

        fig_pie = px.pie(
            b_df,
            values="Budget_Cr",
            names="Pillar",
            color_discrete_sequence=["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"],
            hole=0.4,
            title="CapEx Allocation (₹20 Crores)",
        )
        fig_pie.update_layout(
            paper_bgcolor="#171b20",
            font_color="#d1d5db",
            legend=dict(orientation="h", yanchor="top", y=-0.1),
            margin=dict(l=20, r=20, t=40, b=60),
        )
        st.plotly_chart(fig_pie, use_container_width=True)

    with b_col2:
        st.markdown("#### Capital Deployment Schedule (Total: ₹20.00 Cr)")
        st.table(b_df[["Pillar", "Budget_Cr", "Share_Pct"]])
        st.info("💡 Note: Rider discounts and driver streak bonuses are variable operating outlays financed from parcel cash inflow, completely separate from this ₹20 Cr engineering CapEx.")

    st.markdown("---")
    st.markdown("#### 12-Month Pilot Rollout Phases")
    phases = [
        {"Phase": "Phase 1 (Months 1–3)", "Stage": "Validate & Sandbox", "Milestones": "Regulatory compliance audit in pilot state; legal clarity on motor vehicle luggage rules; sandbox route matching dry runs."},
        {"Phase": "Phase 2 (Months 4–6)", "Stage": "Corridor Alpha (500 Drivers)", "Milestones": "Deploy RouteShare app updates to 500 high-frequency commuter corridor drivers; test small parcel envelopes (<1kg)."},
        {"Phase": "Phase 3 (Months 7–9)", "Stage": "Tier-I City Pilot (5,000 Drivers)", "Milestones": "Expand to full dense Tier-I metro; onboard business merchants (lab samples, documents, retail exchanges); enforce 6-min detour cap."},
        {"Phase": "Phase 4 (Months 10–12)", "Stage": "Scale & Optimization", "Milestones": "Ramp driver participation to 40% of fleet; automate dispute arbitration; test inter-hub parcel staging."},
    ]
    st.table(pd.DataFrame(phases))

# ---------------------------------------------------------
# Footer
# ---------------------------------------------------------
st.markdown("---")
st.markdown("""
<div style="text-align:center; font-size:12px; color:#6b7280; padding:12px 0;">
    RouteShare Pilot Simulator | Team VoltEdge | Strategy Wiz Finals | Renaissance 10.0, MNNIT Allahabad<br/>
    Designed for judges and strategic reviewers to test financial durability, detour constraints, and sensitivity boundaries.
</div>
""", unsafe_allow_html=True)
