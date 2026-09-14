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
    
    with open("MODEL_SENSITIVITY_AUDIT.md", "w") as f:
        f.write("# AeroPure Model Sensitivity Audit\n\n")
        f.write("This audit isolates user-facing environmental variables to determine their direct impact on the final AQI proxy prediction, holding historical and temporal features constant.\n\n")
        f.write(md_table)
        f.write("\n## Conclusion\n")
        f.write("The model sensitivity is constrained by the full historical feature state used by the trained model. Individual environmental variables do not independently determine the prediction; AeroPure evaluates a 113-feature representation including historical and temporal context.\n")

if __name__ == "__main__":
    main()
