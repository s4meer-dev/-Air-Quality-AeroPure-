# AeroPure Model Sensitivity Audit

This audit isolates user-facing environmental variables to determine their direct impact on the final AQI proxy prediction, holding historical and temporal features constant.

Variable | Level | Value | Prediction | Delta
---|---|---|---|---
co | low | 0.5 | 128.70 | -0.80
co | base | 2.0 | 129.50 | +0.00
co | high | 8.0 | 149.30 | +19.80
no2 | low | 30.0 | 126.00 | -3.50
no2 | base | 100.0 | 129.50 | +0.00
no2 | high | 300.0 | 177.20 | +47.70
c6h6 | low | 2.0 | 126.90 | -2.60
c6h6 | base | 10.0 | 129.50 | +0.00
c6h6 | high | 30.0 | 179.40 | +49.90
temperature | low | 10.0 | 128.30 | -1.20
temperature | base | 25.0 | 129.50 | +0.00
temperature | high | 40.0 | 129.50 | +0.00
relative_humidity | low | 20.0 | 129.80 | +0.30
relative_humidity | base | 50.0 | 129.50 | +0.00
relative_humidity | high | 80.0 | 130.80 | +1.30

## Conclusion
The model sensitivity is constrained by the full historical feature state used by the trained model. Individual environmental variables do not independently determine the prediction; AeroPure evaluates a 113-feature representation including historical and temporal context.
