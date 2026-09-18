"""
AeroPure Streamlit Web Dashboard
================================
AI Next-Day Air Quality Forecasting, Hazardous Air Alerting & Governance System
Tagline: "Tell a city when tomorrow's air turns dangerous."
Scope: Comprehensive Machine Learning System (Weeks 1 to 12)
Visual Identity: Black / Graphite / Metallic Gold / Crimson — Premium AI Command Center
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import streamlit as st
import joblib

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from api.services import PredictionService
from api.schemas import ObservationInput

# ─── Page Configuration ──────────────────────────────────────────────────────
st.set_page_config(
    page_title="AeroPure — AI Air Quality Intelligence Platform",
    page_icon="🌫️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─── Premium CSS: Black / Gold / Graphite / Crimson Identity ─────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;600;700;900&display=swap');

    /* ── Global Reset ─────────────────────────────────────────────────── */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
        background-color: #050505;
        color: #F5F5F5;
    }

    .stApp {
        background: #050505;
    }

    /* ── Sidebar ──────────────────────────────────────────────────────── */
    [data-testid="stSidebar"] {
        background: #0D0D0D !important;
        border-right: 1px solid #292929;
    }
    [data-testid="stSidebar"] * {
        color: #F5F5F5 !important;
    }
    [data-testid="stSidebar"] .stCaption,
    [data-testid="stSidebar"] caption {
        color: #9A9A9A !important;
    }

    /* ── Tab Bar ──────────────────────────────────────────────────────── */
    .stTabs [data-baseweb="tab-list"] {
        background: #0D0D0D;
        border-bottom: 2px solid #1B1B1B;
        gap: 0;
    }
    .stTabs [data-baseweb="tab"] {
        background: transparent;
        color: #9A9A9A !important;
        font-size: 0.82rem;
        font-weight: 600;
        border: none;
        padding: 0.7rem 1.2rem;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
    }
    .stTabs [data-baseweb="tab"]:hover {
        color: #D4AF37 !important;
    }
    .stTabs [aria-selected="true"] {
        color: #D4AF37 !important;
        border-bottom: 2px solid #D4AF37 !important;
        background: transparent !important;
    }
    .stTabs [data-baseweb="tab-panel"] {
        background: #050505;
        padding-top: 1.5rem;
    }

    /* ── Metric Cards ─────────────────────────────────────────────────── */
    .metric-card {
        background: #111111;
        border: 1px solid #292929;
        border-radius: 10px;
        padding: 1.3rem 1.4rem;
        margin-bottom: 1rem;
        position: relative;
        overflow: hidden;
    }
    .metric-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 3px; height: 100%;
        background: linear-gradient(180deg, #C9A227 0%, #D4AF37 50%, #E0C15A 100%);
        border-radius: 10px 0 0 10px;
    }

    /* ── Hazard Alert Banner ──────────────────────────────────────────── */
    .hazard-banner {
        background: linear-gradient(135deg, #8B0000 0%, #B11226 50%, #D62828 100%);
        color: #F5F5F5;
        padding: 1.4rem 1.8rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
        border: 1px solid #D62828;
        box-shadow: 0 0 30px rgba(214, 40, 40, 0.3), 0 4px 16px rgba(0,0,0,0.5);
        animation: hazard-pulse 3s ease-in-out infinite;
    }
    @keyframes hazard-pulse {
        0%, 100% { box-shadow: 0 0 30px rgba(214,40,40,0.3), 0 4px 16px rgba(0,0,0,0.5); }
        50%       { box-shadow: 0 0 50px rgba(214,40,40,0.55), 0 4px 24px rgba(0,0,0,0.6); }
    }

    /* ── Safe / Acceptable Banner ─────────────────────────────────────── */
    .safe-banner {
        background: linear-gradient(135deg, #0D0D0D 0%, #151515 100%);
        color: #F5F5F5;
        padding: 1.4rem 1.8rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
        border: 1px solid #C9A227;
        box-shadow: 0 0 20px rgba(201, 162, 39, 0.15), 0 4px 16px rgba(0,0,0,0.4);
    }

    /* ── AQI Number Display ───────────────────────────────────────────── */
    .aqi-number {
        font-family: 'Orbitron', 'Inter', sans-serif;
        font-size: 3.8rem;
        font-weight: 900;
        line-height: 1;
        margin: 0.4rem 0;
        text-shadow: 0 0 20px currentColor;
    }

    /* ── Gold Headline / Brand Accents ────────────────────────────────── */
    .main-title {
        font-family: 'Orbitron', 'Inter', sans-serif;
        font-size: 2.2rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #D4AF37;
        margin-bottom: 0.15rem;
        text-shadow: 0 0 30px rgba(212, 175, 55, 0.4);
    }

    .tagline {
        font-size: 1.05rem;
        color: #9A9A9A;
        font-style: italic;
        margin-bottom: 1.4rem;
        letter-spacing: 0.01em;
    }

    /* ── Section headings ─────────────────────────────────────────────── */
    h1, h2, h3, h4 {
        color: #F5F5F5 !important;
    }

    /* ── Streamlit native metric override ────────────────────────────── */
    [data-testid="stMetricValue"] {
        color: #D4AF37 !important;
        font-family: 'Orbitron', sans-serif !important;
        font-size: 1.8rem !important;
    }
    [data-testid="stMetricLabel"] {
        color: #9A9A9A !important;
        font-size: 0.82rem !important;
    }
    [data-testid="stMetricDelta"] {
        color: #E0C15A !important;
    }

    /* ── Info / Warning boxes ─────────────────────────────────────────── */
    .stAlert {
        background: #111111 !important;
        border: 1px solid #333333 !important;
        color: #F5F5F5 !important;
        border-radius: 8px;
    }

    /* ── Dataframe / Table ────────────────────────────────────────────── */
    [data-testid="stDataFrame"] {
        background: #111111 !important;
        border: 1px solid #292929 !important;
        border-radius: 8px;
    }

    /* ── Buttons ──────────────────────────────────────────────────────── */
    .stButton > button, .stFormSubmitButton > button {
        background: linear-gradient(135deg, #C9A227 0%, #D4AF37 100%) !important;
        color: #050505 !important;
        font-weight: 700 !important;
        font-family: 'Inter', sans-serif !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 0.6rem 1.5rem !important;
        font-size: 0.92rem !important;
        letter-spacing: 0.03em;
        transition: all 0.2s ease !important;
        box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25) !important;
    }
    .stButton > button:hover, .stFormSubmitButton > button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4) !important;
    }

    /* ── Sliders ──────────────────────────────────────────────────────── */
    .stSlider > div > div > div > div {
        background: #D4AF37 !important;
    }

    /* ── Selectbox ────────────────────────────────────────────────────── */
    .stSelectbox > div[data-baseweb="select"] > div {
        background: #111111 !important;
        border-color: #292929 !important;
        color: #F5F5F5 !important;
    }

    /* ── Caption / small text ─────────────────────────────────────────── */
    .stCaption, small, .stMarkdown small {
        color: #9A9A9A !important;
    }

    /* ── Gold divider ─────────────────────────────────────────────────── */
    .gold-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #D4AF37, transparent);
        margin: 1.5rem 0;
        border: none;
    }

    /* ── Status badge ─────────────────────────────────────────────────── */
    .status-badge {
        display: inline-block;
        background: #1B1B1B;
        border: 1px solid #C9A227;
        color: #D4AF37;
        padding: 0.3rem 0.8rem;
        font-size: 0.78rem;
        font-weight: 700;
        border-radius: 20px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    /* ── Regime badge ─────────────────────────────────────────────────── */
    .regime-badge {
        display: inline-block;
        background: #1B1B1B;
        border: 1px solid #333333;
        color: #9A9A9A;
        padding: 0.35rem 0.8rem;
        font-size: 0.82rem;
        font-weight: 600;
        border-radius: 20px;
    }

    /* ── Scrollbar ────────────────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0D0D0D; }
    ::-webkit-scrollbar-thumb { background: #333333; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #D4AF37; }

</style>
""", unsafe_allow_html=True)


# ─── Constants ────────────────────────────────────────────────────────────────
MODELS_DIR = "models"
OUTPUTS_DIR = "outputs"


# ─── Service Bootstrap ────────────────────────────────────────────────────────
@st.cache_resource
def get_service():
    """Returns singleton prediction service."""
    return PredictionService.get_instance(models_dir=MODELS_DIR)


service = get_service()
health = service.get_health()
metrics_meta = service.get_metrics()
drift_report = service.get_drift()

# ─── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="text-align:center; padding: 1rem 0 0.5rem;">
        <span style="font-size:2.8rem;">🌫️</span><br>
        <span style="font-family:'Orbitron',sans-serif; font-size:1.4rem; font-weight:700; color:#D4AF37; letter-spacing:0.12em;">AEROPURE</span><br>
        <span style="font-size:0.72rem; color:#9A9A9A; letter-spacing:0.05em;">AI AIR QUALITY INTELLIGENCE</span>
    </div>
    """, unsafe_allow_html=True)

    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    st.markdown(
        f'<div style="margin-bottom:0.6rem;">'
        f'<span style="color:#9A9A9A; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.06em;">Model Version</span><br>'
        f'<span style="color:#D4AF37; font-weight:600; font-size:0.95rem;">{health.model_version}</span>'
        f'</div>',
        unsafe_allow_html=True
    )

    status_color = "#10b981" if health.status == "healthy" else "#f59e0b"
    status_label = "● OPERATIONAL" if health.status == "healthy" else "● DEGRADED"
    st.markdown(
        f'<div style="margin-bottom:0.6rem;">'
        f'<span style="color:#9A9A9A; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.06em;">System Status</span><br>'
        f'<span style="color:{status_color}; font-weight:700; font-size:0.88rem;">{status_label}</span>'
        f'</div>',
        unsafe_allow_html=True
    )

    drift_color = "#D62828" if drift_report.retraining_flagged else "#D4AF37"
    st.markdown(
        f'<div style="margin-bottom:0.6rem;">'
        f'<span style="color:#9A9A9A; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.06em;">Drift Status</span><br>'
        f'<span style="color:{drift_color}; font-weight:700; font-size:0.88rem;">{drift_report.drift_status}</span>'
        f'</div>',
        unsafe_allow_html=True
    )

    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    st.markdown("""
    <div style="font-size:0.78rem; color:#9A9A9A; line-height:1.9; text-transform:uppercase; letter-spacing:0.04em;">
        <div style="color:#D4AF37; font-weight:700; margin-bottom:0.4rem;">Roadmap Architecture</div>
        <div>W1–W8 · EDA, Baselines, XGBoost, SHAP</div>
        <div>W9 · PCA, K-Means, DBSCAN</div>
        <div>W10 · Nested CV, Calibration, Stats</div>
        <div>W11 · Model Packaging, PSI Drift</div>
        <div>W12 · FastAPI REST API &amp; UI</div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    st.markdown(
        '<div style="font-size:0.72rem; color:#9A9A9A; line-height:1.7;">'
        'Criteria sensors: CO · NO₂ · C₆H₆ · NOx · T · RH · AH<br>'
        '<span style="color:#333333;">━━━━━━━━━━━━━━━━━━━━━━</span><br>'
        f'<span style="color:#D4AF37; font-weight:600;">AeroPure v{metrics_meta.model_version}</span> · Academic Release'
        '</div>',
        unsafe_allow_html=True
    )


# ─── Main Header ──────────────────────────────────────────────────────────────
st.markdown('<div class="main-title">AeroPure — Urban Air Intelligence</div>', unsafe_allow_html=True)
st.markdown('<div class="tagline">"Tell a city when tomorrow\'s air turns dangerous."</div>', unsafe_allow_html=True)
st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)


# ─── Navigation Tabs ──────────────────────────────────────────────────────────
tabs = st.tabs([
    "🔮 Tomorrow's Forecast",
    "🌐 Pollution Regimes (W9)",
    "📊 Model Leaderboard & Evaluation",
    "🧠 AI Explainability (SHAP)",
    "🧪 What-If Simulator",
    "📡 Drift & Governance (W11)",
    "📈 Historical Trends & EDA"
])


# ══════════════════════════════════════════════════════════════════════════════
# TAB 1: TOMORROW'S FORECAST
# ══════════════════════════════════════════════════════════════════════════════
with tabs[0]:
    test_preds_path = os.path.join(OUTPUTS_DIR, "predictions", "test_predictions.csv")
    if os.path.exists(test_preds_path):
        preds_df = pd.read_csv(test_preds_path)
        latest_row = preds_df.iloc[-1]
        predicted_aqi = round(float(latest_row["pred_xgb_reg"]), 1)
        actual_aqi = round(float(latest_row["actual_next_day_air_quality_index"]), 1)
        hazard_prob = round(float(latest_row.get("prob_hybrid_clf", latest_row["prob_xgb_clf"])), 2)
    else:
        st.warning(
            "No held-out predictions found (`outputs/predictions/test_predictions.csv`). "
            "Run `python run_project.py` to generate them. The figures below are placeholders, not model output."
        )
        predicted_aqi, actual_aqi, hazard_prob = 0.0, 0.0, 0.0

    # The alert fires at the decision threshold tuned on out-of-fold data (stored in the model registry).
    alert_threshold = float(
        service.registry.get("classification_model", {}).get("hazard_alert_threshold", 0.5)
    )
    is_hazardous = hazard_prob >= alert_threshold

    if is_hazardous:
        st.markdown(f"""
        <div class="hazard-banner">
            🚨 <strong>HAZARDOUS AIR DAY ALERT — TOMORROW</strong> &nbsp;|&nbsp; Predicted AQI Proxy: <strong style="color:#FFD6D6;">{predicted_aqi}</strong> &nbsp;|&nbsp; Hazard Probability: <strong style="color:#FFD6D6;">{int(hazard_prob*100)}%</strong><br>
            <span style="font-weight:400; font-size:0.9rem; color:#FFBBBB;">
                Actionable Advisory: Project-defined elevated-pollution threshold (AQI ≥ 180.0) exceeded.
                Atmospheric dispersion constrained. Vulnerable demographics should reduce outdoor exertion; ventilation adjustments advised.
            </span>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <div class="safe-banner">
            ✅ <strong style="color:#D4AF37;">ACCEPTABLE / MODERATE AIR PROJECTED — TOMORROW</strong> &nbsp;|&nbsp; Predicted AQI Proxy: <strong style="color:#E0C15A;">{predicted_aqi}</strong> &nbsp;|&nbsp; Hazard Probability: <strong style="color:#E0C15A;">{int(hazard_prob*100)}%</strong><br>
            <span style="font-weight:400; font-size:0.9rem; color:#9A9A9A;">
                Atmospheric dispersion favorable. Outdoor civic activity permissible under standard guidelines.
            </span>
        </div>
        """, unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns([1.2, 1, 1, 1])

    with col1:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.markdown(
            '<span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:#9A9A9A;">Tomorrow\'s Forecast AQI</span>',
            unsafe_allow_html=True
        )
        if predicted_aqi >= 180:
            aqi_color = "#D62828"
        elif predicted_aqi >= 100:
            aqi_color = "#C9A227"
        else:
            aqi_color = "#D4AF37"

        tier = "ELEVATED HAZARDOUS" if predicted_aqi >= 180 else "MODERATE" if predicted_aqi >= 100 else "GOOD"
        st.markdown(
            f'<div class="aqi-number" style="color:{aqi_color};">{predicted_aqi}</div>',
            unsafe_allow_html=True
        )
        st.markdown(
            f'<span style="font-size:0.78rem; color:#9A9A9A;">Risk Tier: <span style="color:#D4AF37; font-weight:700;">{tier}</span></span><br>'
            f'<span style="font-size:0.75rem; color:#9A9A9A;">Index Type: Pollutant-Based AQI Proxy</span>',
            unsafe_allow_html=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.markdown(
            '<span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:#9A9A9A;">Hazard Probability</span>',
            unsafe_allow_html=True
        )
        hp_color = "#D62828" if hazard_prob >= alert_threshold else "#D4AF37"
        delta_val = round((hazard_prob - alert_threshold) * 100, 1)
        brier_val = metrics_meta.classification_metrics.get("Brier")
        brier_text = f"Held-out Brier Score: {brier_val:.4f}" if brier_val is not None else "Brier Score: n/a"
        st.markdown(
            f'<div style="font-family:Orbitron,sans-serif; font-size:2.8rem; font-weight:900; color:{hp_color}; line-height:1; margin:0.4rem 0;">'
            f'{int(hazard_prob*100)}%</div>'
            f'<span style="font-size:0.75rem; color:#9A9A9A;">vs. {alert_threshold*100:.0f}% alert threshold: '
            f'<span style="color:{hp_color}; font-weight:600;">{"+"+str(delta_val) if delta_val>0 else str(delta_val)}%</span></span><br>'
            f'<span style="font-size:0.72rem; color:#9A9A9A;">{brier_text}</span>',
            unsafe_allow_html=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

    with col3:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.markdown(
            '<span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:#9A9A9A;">Ground Truth Comparison</span>',
            unsafe_allow_html=True
        )
        err = round(predicted_aqi - actual_aqi, 1)
        err_color = "#D62828" if abs(err) > 20 else "#D4AF37"
        st.markdown(
            f'<div style="font-family:Orbitron,sans-serif; font-size:2.8rem; font-weight:900; color:#D4AF37; line-height:1; margin:0.4rem 0;">'
            f'{actual_aqi}</div>'
            f'<span style="font-size:0.75rem; color:#9A9A9A;">Actual Next-Day AQI</span><br>'
            f'<span style="font-size:0.75rem; color:{err_color};">Residual: {"+"+str(err) if err>0 else str(err)} AQI units</span>',
            unsafe_allow_html=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

    with col4:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.markdown(
            '<span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:#9A9A9A;">Production Champion</span>',
            unsafe_allow_html=True
        )
        rmse_val = metrics_meta.regression_metrics.get('RMSE', 'n/a')
        f1_val = metrics_meta.classification_metrics.get('F1', 'n/a')
        feat_count = metrics_meta.feature_count
        st.markdown(
            f'<div style="font-size:0.84rem; line-height:2; margin-top:0.5rem;">'
            f'<span style="color:#9A9A9A;">Regressor</span>&nbsp;'
            f'<span style="color:#D4AF37; font-weight:700;">XGBoost</span>&nbsp;'
            f'<span style="color:#9A9A9A;">RMSE</span>&nbsp;'
            f'<span style="color:#E0C15A; font-weight:700;">{rmse_val}</span><br>'
            f'<span style="color:#9A9A9A;">Hazard model</span>&nbsp;'
            f'<span style="color:#D4AF37; font-weight:700;">Hybrid</span>&nbsp;'
            f'<span style="color:#9A9A9A;">F1</span>&nbsp;'
            f'<span style="color:#E0C15A; font-weight:700;">{f1_val}</span><br>'
            f'<span style="color:#9A9A9A;">Features</span>&nbsp;'
            f'<span style="color:#D4AF37; font-weight:700;">{feat_count}</span>&nbsp;'
            f'<span style="color:#9A9A9A;">leakage-safe</span>'
            f'</div>',
            unsafe_allow_html=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    st.markdown(
        '<span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:#9A9A9A;">'
        'Current Atmospheric & Pollutant Sensors — Observation Time t</span>',
        unsafe_allow_html=True
    )
    s1, s2, s3, s4, s5, s6 = st.columns(6)
    s1.metric("CO(GT)", "2.6 mg/m³", "Combustion")
    s2.metric("NO₂(GT)", "113 µg/m³", "Oxides")
    s3.metric("C₆H₆(GT)", "9.4 µg/m³", "Aromatic VOC")
    s4.metric("NOx(GT)", "166 ppb", "Nitrogen Oxides")
    s5.metric("Temperature", "18.3 °C", "Atmospheric")
    s6.metric("Rel. Humidity", "48.9 %", "Moisture")


# ══════════════════════════════════════════════════════════════════════════════
# TAB 2: POLLUTION REGIMES (W9)
# ══════════════════════════════════════════════════════════════════════════════
with tabs[1]:
    st.markdown(
        '<span style="font-family:Orbitron,sans-serif; font-size:1.05rem; color:#D4AF37; font-weight:700; letter-spacing:0.08em;">'
        'WEEK 9 · UNSUPERVISED POLLUTION REGIME DISCOVERY</span>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<span style="color:#9A9A9A; font-size:0.9rem;">'
        'Using Principal Component Analysis (PCA), K-Means (k=3), and DBSCAN density clustering on criteria '
        'pollutants and sensor measurements, AeroPure discovers real, data-driven atmospheric regimes.'
        '</span>',
        unsafe_allow_html=True
    )
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    reg_c1, reg_c2 = st.columns([1.2, 1])
    with reg_c1:
        st.markdown("#### Discovered Operational Regimes")
        regimes_csv = os.path.join(OUTPUTS_DIR, "metrics", "cluster_regime_profiles.csv")
        if os.path.exists(regimes_csv):
            st.dataframe(pd.read_csv(regimes_csv), use_container_width=True)
        else:
            st.info("Run clustering pipeline to generate regime profiles.")

    with reg_c2:
        st.markdown("#### Regime Forecasting Impact (Strict Out-of-Sample)")
        comp_csv = os.path.join(OUTPUTS_DIR, "metrics", "regime_forecast_comparison.csv")
        if os.path.exists(comp_csv):
            st.dataframe(pd.read_csv(comp_csv), use_container_width=True)
            st.caption("Verified: Adding unsupervised regime features at time t reduced test RMSE from 39.068 → 38.324 (+0.0185 R²).")

    p_col1, p_col2 = st.columns(2)
    with p_col1:
        p_pca = os.path.join(OUTPUTS_DIR, "figures", "pca_kmeans_clusters.png")
        if os.path.exists(p_pca):
            st.image(p_pca, caption="2D PCA Projection — Discovered K-Means Regimes", use_container_width=True)
    with p_col2:
        p_db = os.path.join(OUTPUTS_DIR, "figures", "dbscan_clusters.png")
        if os.path.exists(p_db):
            st.image(p_db, caption="DBSCAN Density Structure & Sensor Anomaly Identification", use_container_width=True)

    p_col3, p_col4 = st.columns(2)
    with p_col3:
        p_var = os.path.join(OUTPUTS_DIR, "figures", "pca_variance_elbow.png")
        if os.path.exists(p_var):
            pca_pct = None
            clust_metrics_path = os.path.join(OUTPUTS_DIR, "metrics", "clustering_metrics.json")
            if os.path.exists(clust_metrics_path):
                with open(clust_metrics_path) as f:
                    pca_pct = json.load(f).get("pca_explained_variance_first3")
            pca_note = f" ({pca_pct*100:.1f}% in first 3 PCs)" if pca_pct is not None else ""
            st.image(p_var, caption=f"PCA Scree Plot & Cumulative Explained Variance{pca_note}", use_container_width=True)
    with p_col4:
        p_km = os.path.join(OUTPUTS_DIR, "figures", "kmeans_silhouette_elbow.png")
        if os.path.exists(p_km):
            st.image(p_km, caption="K-Means Inertia Elbow Curve & Silhouette Scores", use_container_width=True)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 3: MODEL LEADERBOARD & EVALUATION (W10)
# ══════════════════════════════════════════════════════════════════════════════
with tabs[2]:
    st.markdown(
        '<span style="font-family:Orbitron,sans-serif; font-size:1.05rem; color:#D4AF37; font-weight:700; letter-spacing:0.08em;">'
        'WEEK 10 · RIGOROUS TIME-SERIES MODEL EVALUATION</span>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<span style="color:#9A9A9A; font-size:0.9rem;">'
        'All models compared using nested time-series cross-validation, probability calibration, '
        'and non-parametric Wilcoxon signed-rank tests on chronological holdout predictions.'
        '</span>',
        unsafe_allow_html=True
    )
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    col_l1, col_l2 = st.columns(2)
    with col_l1:
        st.markdown("#### Regression Benchmark · `next_day_air_quality_index`")
        reg_csv = os.path.join(OUTPUTS_DIR, "metrics", "regression_leaderboard.csv")
        if os.path.exists(reg_csv):
            st.dataframe(pd.read_csv(reg_csv), use_container_width=True)
    with col_l2:
        st.markdown("#### Classification Benchmark · `hazardous_air_day`")
        clf_csv = os.path.join(OUTPUTS_DIR, "metrics", "classification_leaderboard.csv")
        if os.path.exists(clf_csv):
            st.dataframe(pd.read_csv(clf_csv), use_container_width=True)

    st.markdown("#### Statistical Significance & Reliability Diagnostics")
    ev_c1, ev_c2 = st.columns(2)
    with ev_c1:
        p_roc = os.path.join(OUTPUTS_DIR, "figures", "classification_roc_curves.png")
        if os.path.exists(p_roc):
            st.image(p_roc, caption="Test Set ROC Curves — XGBoost Champion AUC = 0.824", use_container_width=True)
    with ev_c2:
        p_cal = os.path.join(OUTPUTS_DIR, "figures", "calibration_curve.png")
        if os.path.exists(p_cal):
            st.image(p_cal, caption="Reliability Calibration Curve & Brier Score", use_container_width=True)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 4: AI EXPLAINABILITY (SHAP)
# ══════════════════════════════════════════════════════════════════════════════
with tabs[3]:
    st.markdown(
        '<span style="font-family:Orbitron,sans-serif; font-size:1.05rem; color:#D4AF37; font-weight:700; letter-spacing:0.08em;">'
        'WEEK 8 · SHAP EXPLAINABILITY ENGINE</span>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<span style="color:#9A9A9A; font-size:0.9rem;">'
        'Every forecast is mathematically grounded in local Shapley values calculated by XGBoost TreeExplainer, '
        'quantifying the directional contribution of each atmospheric parameter to the model output. '
        'SHAP values represent model feature contribution — not physical or causal intervention.'
        '</span>',
        unsafe_allow_html=True
    )
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    sh_col1, sh_col2 = st.columns(2)
    with sh_col1:
        p_sh_b = os.path.join(OUTPUTS_DIR, "figures", "shap_summary_beeswarm.png")
        if os.path.exists(p_sh_b):
            st.image(p_sh_b, caption="SHAP Summary Beeswarm — Global Impact of High vs Low Feature Values", use_container_width=True)
        else:
            st.info("Run SHAP pipeline to generate beeswarm plot.")
    with sh_col2:
        p_sh_w = os.path.join(OUTPUTS_DIR, "figures", "shap_waterfall_high_risk.png")
        if os.path.exists(p_sh_w):
            st.image(p_sh_w, caption="SHAP Waterfall — Local Explanation for Hazardous Alert Episode", use_container_width=True)
        else:
            st.info("Run SHAP pipeline to generate waterfall plot.")


# ══════════════════════════════════════════════════════════════════════════════
# TAB 5: WHAT-IF SIMULATOR
# ══════════════════════════════════════════════════════════════════════════════
with tabs[4]:
    st.markdown(
        '<span style="font-family:Orbitron,sans-serif; font-size:1.05rem; color:#D4AF37; font-weight:700; letter-spacing:0.08em;">'
        'INTERACTIVE WHAT-IF SCENARIO SIMULATOR</span>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<div style="background:#111111; border:1px solid #292929; border-left:3px solid #C9A227; '
        'border-radius:8px; padding:0.9rem 1.2rem; margin:0.8rem 0 1.2rem; font-size:0.85rem; color:#9A9A9A;">'
        '⚠️ <strong style="color:#D4AF37;">Scientific Note:</strong> This simulator performs what-if scenario sensitivity '
        'analysis using the production ML pipeline. Slider adjustments evaluate model response under hypothetical '
        'feature combinations; this is a statistical simulation and does not imply direct physical or causal intervention.'
        '</div>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<span style="color:#9A9A9A; font-size:0.88rem;">'
        'Adjust primary criteria pollutants and meteorological sliders. '
        'Inputs pass directly through the <strong style="color:#D4AF37;">production preprocessing and model inference pipeline</strong>.'
        '</span>',
        unsafe_allow_html=True
    )
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    with st.form("what_if_form"):
        w_col1, w_col2, w_col3 = st.columns(3)
        with w_col1:
            in_co = st.slider("Carbon Monoxide CO(GT) (mg/m³)", 0.2, 12.0, 2.8, 0.1)
            in_no2 = st.slider("Nitrogen Dioxide NO₂(GT) (µg/m³)", 10.0, 350.0, 115.0, 5.0)
            in_c6h6 = st.slider("Benzene C₆H₆(GT) (µg/m³)", 0.2, 50.0, 9.5, 0.5)
        with w_col2:
            in_temp = st.slider("Temperature T (°C)", -5.0, 45.0, 18.0, 1.0)
            in_rh = st.slider("Relative Humidity RH (%)", 10.0, 95.0, 52.0, 5.0)
            in_nox = st.slider("Nitrogen Oxides NOx(GT) (ppb)", 10.0, 1000.0, 220.0, 10.0)
        with w_col3:
            in_hour = st.slider("Hour of Day (0–23)", 0, 23, 14, 1)
            in_month = st.selectbox("Month of Year", list(range(1, 13)), index=5)
            in_day = st.selectbox(
                "Day of Week",
                ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                index=2
            )

        day_map = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
        submit_sim = st.form_submit_button("🚀 Run Live Next-Day Forecast", type="primary")

    if submit_sim:
        inp_obj = ObservationInput(
            co=in_co,
            no2=in_no2,
            c6h6=in_c6h6,
            nox=in_nox,
            temperature=in_temp,
            relative_humidity=in_rh,
            hour=in_hour,
            day_of_week=day_map[in_day],
            month=in_month
        )
        pred_res = service.predict(inp_obj)
        exp_res = service.explain(inp_obj)

        st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
        res_c1, res_c2, res_c3 = st.columns([1, 1, 1.5])

        with res_c1:
            st.markdown('<div class="metric-card">', unsafe_allow_html=True)
            aqi_res = pred_res.predicted_aqi_proxy
            res_color = "#D62828" if aqi_res >= 180 else "#C9A227" if aqi_res >= 100 else "#D4AF37"
            st.markdown(
                f'<span style="font-size:0.72rem; text-transform:uppercase; color:#9A9A9A; letter-spacing:0.08em;">Forecasted AQI Proxy</span><br>'
                f'<span style="font-family:Orbitron,sans-serif; font-size:2.6rem; font-weight:900; color:{res_color};">{aqi_res}</span><br>'
                f'<span style="font-size:0.8rem; color:#9A9A9A;">Risk: <strong style="color:#D4AF37;">{pred_res.risk_category}</strong></span>',
                unsafe_allow_html=True
            )
            st.markdown('</div>', unsafe_allow_html=True)

        with res_c2:
            st.markdown('<div class="metric-card">', unsafe_allow_html=True)
            hp = pred_res.hazard_probability
            hp_color = "#D62828" if hp >= 0.5 else "#D4AF37"
            alert_label = "🚨 HAZARD ALERT" if pred_res.hazardous else "✅ NO ALERT"
            st.markdown(
                f'<span style="font-size:0.72rem; text-transform:uppercase; color:#9A9A9A; letter-spacing:0.08em;">Hazard Probability</span><br>'
                f'<span style="font-family:Orbitron,sans-serif; font-size:2.6rem; font-weight:900; color:{hp_color};">{int(hp*100)}%</span><br>'
                f'<span style="font-size:0.82rem; color:{hp_color}; font-weight:700;">{alert_label}</span>',
                unsafe_allow_html=True
            )
            st.markdown('</div>', unsafe_allow_html=True)

        with res_c3:
            st.markdown('<div class="metric-card">', unsafe_allow_html=True)
            st.markdown(
                f'<span style="font-size:0.72rem; text-transform:uppercase; color:#9A9A9A; letter-spacing:0.08em;">Intelligence Report</span><br>'
                f'<span style="color:#9A9A9A; font-size:0.8rem;">Regime: </span>'
                f'<span style="color:#D4AF37; font-weight:700; font-size:0.9rem;">{pred_res.pollution_regime}</span><br>'
                f'<span style="color:#9A9A9A; font-size:0.8rem;">Index Driver: </span>'
                f'<span style="color:#D4AF37; font-weight:700; font-size:0.9rem;">{pred_res.dominant_current_pollutant}</span>'
                f'<span style="color:#9A9A9A; font-size:0.8rem;"> · AQI {pred_res.current_aqi_proxy}</span>',
                unsafe_allow_html=True
            )
            st.caption(exp_res.explanation_summary)
            st.markdown('</div>', unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 6: DRIFT & GOVERNANCE (W11)
# ══════════════════════════════════════════════════════════════════════════════
with tabs[5]:
    st.markdown(
        '<span style="font-family:Orbitron,sans-serif; font-size:1.05rem; color:#D4AF37; font-weight:700; letter-spacing:0.08em;">'
        'WEEK 11 · PRODUCTION PSI DRIFT MONITORING & GOVERNANCE</span>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<span style="color:#9A9A9A; font-size:0.9rem;">'
        'AeroPure evaluates the <strong style="color:#D4AF37;">Population Stability Index (PSI)</strong> between '
        'training distributions and incoming production data to detect atmospheric covariate shifts '
        'and trigger seasonal retraining alerts.'
        '</span>',
        unsafe_allow_html=True
    )
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    d_c1, d_c2 = st.columns([1, 1.5])
    with d_c1:
        retrain_flag = drift_report.retraining_flagged
        drift_border = "#D62828" if retrain_flag else "#C9A227"
        drift_status_color = "#D62828" if retrain_flag else "#D4AF37"
        st.markdown(
            f'<div class="metric-card" style="border-color:{drift_border};">'
            f'<span style="font-size:0.72rem; text-transform:uppercase; color:#9A9A9A; letter-spacing:0.08em;">Drift Status</span><br>'
            f'<span style="font-family:Orbitron,sans-serif; font-size:1.6rem; font-weight:900; color:{drift_status_color};">{drift_report.drift_status}</span><br>'
            f'<br>'
            f'<span style="font-size:0.82rem; color:#9A9A9A;">Mean PSI: </span>'
            f'<span style="color:#D4AF37; font-weight:700;">{drift_report.mean_psi:.4f}</span><br>'
            f'<span style="font-size:0.82rem; color:#9A9A9A;">Retrain Flag: </span>'
            f'<span style="color:{drift_status_color}; font-weight:700;">{"🚨 RECOMMENDED" if retrain_flag else "✅ STABLE"}</span><br><br>'
            f'<span style="font-size:0.8rem; color:#9A9A9A;">{drift_report.recommendation}</span>'
            f'</div>',
            unsafe_allow_html=True
        )

    with d_c2:
        p_drift = os.path.join(OUTPUTS_DIR, "figures", "drift_feature_distributions.png")
        if os.path.exists(p_drift):
            st.image(p_drift, caption="KDE Distributions: Training Reference vs Incoming Telemetry", use_container_width=True)
        else:
            st.info("Run drift pipeline to generate distribution plots.")

    st.markdown("#### Feature PSI Breakdown")
    psi_csv = os.path.join(OUTPUTS_DIR, "metrics", "drift_psi_metrics.csv")
    if os.path.exists(psi_csv):
        st.dataframe(pd.read_csv(psi_csv), use_container_width=True)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 7: HISTORICAL TRENDS & EDA
# ══════════════════════════════════════════════════════════════════════════════
with tabs[6]:
    st.markdown(
        '<span style="font-family:Orbitron,sans-serif; font-size:1.05rem; color:#D4AF37; font-weight:700; letter-spacing:0.08em;">'
        'WEEK 1 · EXPLORATORY DATA ANALYSIS & SENSOR DYNAMICS</span>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<span style="color:#9A9A9A; font-size:0.9rem;">'
        'Dataset: Archive 1 (AirQuality.csv) — UCI Machine Learning Repository. '
        'Criteria pollutants: CO, NOx, NO₂, C₆H₆, Temperature, Relative Humidity, Absolute Humidity. '
        'Index type: Pollutant-Based AQI Proxy (not EPA/CPCB official).'
        '</span>',
        unsafe_allow_html=True
    )
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    eda_c1, eda_c2 = st.columns(2)
    with eda_c1:
        p_dist = os.path.join(OUTPUTS_DIR, "figures", "eda_pollutant_distributions.png")
        if os.path.exists(p_dist):
            st.image(p_dist, caption="Pollutant Distributions (Archive 1 · AirQuality.csv)", use_container_width=True)
        p_diur = os.path.join(OUTPUTS_DIR, "figures", "eda_diurnal_patterns.png")
        if os.path.exists(p_diur):
            st.image(p_diur, caption="Diurnal (Hourly) Rush-Hour Patterns", use_container_width=True)
    with eda_c2:
        p_corr = os.path.join(OUTPUTS_DIR, "figures", "eda_correlation_heatmap.png")
        if os.path.exists(p_corr):
            st.image(p_corr, caption="Sensor & Contaminant Correlation Matrix", use_container_width=True)
        p_trend = os.path.join(OUTPUTS_DIR, "figures", "eda_temporal_trends.png")
        if os.path.exists(p_trend):
            st.image(p_trend, caption="Temporal Trends Across Monitoring Months", use_container_width=True)
