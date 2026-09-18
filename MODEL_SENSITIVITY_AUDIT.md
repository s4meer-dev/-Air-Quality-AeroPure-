# AeroPure Model Sensitivity Audit

One-at-a-time sensitivity of the next-day AQI proxy forecast to each user-facing input. No history is supplied, so each input is held at the tested level for the preceding week (steady-state assumption) and every lag/rolling/trend feature is rebuilt from it by the same feature pipeline used in training.

Variable | Level | Value | Prediction | Delta
---|---|---|---|---
co | low | 0.5 | 129.80 | +0.60
co | base | 2.0 | 129.20 | +0.00
co | high | 8.0 | 157.30 | +28.10
no2 | low | 30.0 | 106.10 | -23.10
no2 | base | 100.0 | 129.20 | +0.00
no2 | high | 300.0 | 193.50 | +64.30
c6h6 | low | 2.0 | 132.10 | +2.90
c6h6 | base | 10.0 | 129.20 | +0.00
c6h6 | high | 30.0 | 187.80 | +58.60
temperature | low | 10.0 | 132.40 | +3.20
temperature | base | 25.0 | 129.20 | +0.00
temperature | high | 40.0 | 127.90 | -1.30
relative_humidity | low | 20.0 | 131.50 | +2.30
relative_humidity | base | 50.0 | 129.20 | +0.00
relative_humidity | high | 80.0 | 129.00 | -0.20

## Response span (high level minus low level)

- `no2`: +87.4 AQI points
- `c6h6`: +55.7 AQI points
- `co`: +27.5 AQI points
- `temperature`: -4.5 AQI points
- `relative_humidity`: -2.5 AQI points

## Conclusion
The forecast responds to the pollutant inputs that define the AQI proxy (NO2, benzene, CO) and only weakly to temperature and humidity, which is the expected ordering. An earlier version of this audit showed muted, inconsistent responses (e.g. no change at all between 25 and 40 degrees C) because the service left 86 of 113 lag/rolling features at dataset medians and silently ignored six mis-named overrides; that train/serve skew is fixed and covered by `tests/test_api.py::test_serving_features_match_training_features`.
