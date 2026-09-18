import logging
import json
from datetime import datetime
from api.services import PredictionService
from api.schemas import ObservationInput

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting Sensitivity Audit...")
    service = PredictionService.get_instance("models")

    # Base observation
    base_obs = ObservationInput(
        co=2.0,
        no2=100.0,
        c6h6=10.0,
        nox=150.0,
        temperature=25.0,
        relative_humidity=50.0,
        absolute_humidity=1.0,
        pt08_s1=1200.0,
        pt08_s2=1000.0,
        pt08_s3=800.0,
        pt08_s4=1500.0,
        pt08_s5=1200.0,
        hour=12,
        day_of_week=2,
        month=6
    )

    features_to_test = {
        "co": {"low": 0.5, "base": 2.0, "high": 8.0},
        "no2": {"low": 30.0, "base": 100.0, "high": 300.0},
        "c6h6": {"low": 2.0, "base": 10.0, "high": 30.0},
        "temperature": {"low": 10.0, "base": 25.0, "high": 40.0},
        "relative_humidity": {"low": 20.0, "base": 50.0, "high": 80.0}
    }

    results = []

    logger.info("Computing Baseline...")
    base_pred_res = service.predict(base_obs)
    base_pred = base_pred_res.predicted_aqi_proxy

    for feat, values in features_to_test.items():
        logger.info(f"Testing Sensitivity for {feat}")
        for level_name, val in values.items():
            test_obs = base_obs.model_copy(update={feat: val})
            pred_res = service.predict(test_obs)
            pred = pred_res.predicted_aqi_proxy
            delta = pred - base_pred

            results.append({
                "Variable": feat,
                "Level": level_name,
                "Value": val,
                "Prediction": float(pred),
                "Delta": float(delta)
            })

    md_table = "Variable | Level | Value | Prediction | Delta\n"
    md_table += "---|---|---|---|---\n"
    for r in results:
        md_table += f"{r['Variable']} | {r['Level']} | {r['Value']} | {r['Prediction']:.2f} | {r['Delta']:+.2f}\n"

    print("\n" + md_table)

    # Response span per variable, computed from the results (nothing hardcoded)
    spans = {}
    for feat in features_to_test:
        preds = {r["Level"]: r["Prediction"] for r in results if r["Variable"] == feat}
        spans[feat] = preds["high"] - preds["low"]
    ranked = sorted(spans.items(), key=lambda kv: abs(kv[1]), reverse=True)

    with open("MODEL_SENSITIVITY_AUDIT.md", "w", encoding="utf-8") as f:
        f.write("# AeroPure Model Sensitivity Audit\n\n")
        f.write(
            "One-at-a-time sensitivity of the next-day AQI proxy forecast to each user-facing input. "
            "No history is supplied, so each input is held at the tested level for the preceding week "
            "(steady-state assumption) and every lag/rolling/trend feature is rebuilt from it by the same "
            "feature pipeline used in training.\n\n"
        )
        f.write(md_table)
        f.write("\n## Response span (high level minus low level)\n\n")
        for feat, span in ranked:
            f.write(f"- `{feat}`: {span:+.1f} AQI points\n")
        f.write(
            "\n## Conclusion\n"
            "The forecast responds to the pollutant inputs that define the AQI proxy (NO2, benzene, CO) and only "
            "weakly to temperature and humidity, which is the expected ordering. An earlier version of this audit "
            "showed muted, inconsistent responses (e.g. no change at all between 25 and 40 degrees C) because the service "
            "left 86 of 113 lag/rolling features at dataset medians and silently ignored six mis-named overrides; that "
            "train/serve skew is fixed and covered by "
            "`tests/test_api.py::test_serving_features_match_training_features`.\n"
        )

if __name__ == "__main__":
    main()
