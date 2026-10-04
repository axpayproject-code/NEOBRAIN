import unittest

import pandas as pd

from climate_data import climap_csv_to_frame, monthly_indicators, nasa_power_json_to_frame, normalize_daily_frame, rainfall_window_comparison


class ClimateDataTests(unittest.TestCase):
    def test_normalize_sorts_dates_and_nulls_invalid_rainfall(self):
        raw = pd.DataFrame({"date": ["2020-01-02", "2020-01-01"], "precip_mm": [12, -999]})
        result = normalize_daily_frame(raw)
        self.assertTrue(result["date"].is_monotonic_increasing)
        self.assertTrue(pd.isna(result.loc[0, "precip_mm"]))

    def test_normalize_rejects_duplicate_dates(self):
        raw = pd.DataFrame({"date": ["2020-01-01", "2020-01-01"], "precip_mm": [0, 1]})
        with self.assertRaisesRegex(ValueError, "Duplicate daily dates"):
            normalize_daily_frame(raw)

    def test_power_json_parses_parameters_and_fill_value(self):
        payload = {"properties": {"parameter": {
            "PRECTOTCORR": {"20200101": 0.0, "20200102": -999},
            "T2M_MAX": {"20200101": 30.1, "20200102": 31.0},
            "T2M_MIN": {"20200101": 22.0, "20200102": 22.5},
        }}}
        result = nasa_power_json_to_frame(payload)
        self.assertEqual(len(result), 2)
        self.assertEqual(result.loc[0, "precip_mm"], 0)
        self.assertTrue(pd.isna(result.loc[1, "precip_mm"]))

    def test_monthly_normals_use_baseline_years(self):
        dates = pd.date_range("2000-01-01", "2019-01-31", freq="D")
        frame = pd.DataFrame({"date": dates, "precip_mm": 1.0})
        result = monthly_indicators(frame, baseline_start=2000, baseline_end=2019, minimum_baseline_years=15)
        jan_2000 = result[result["month"].astype(str) == "2000-01"].iloc[0]
        self.assertEqual(jan_2000["baseline_years"], 20)
        self.assertAlmostEqual(jan_2000["normal_mm"], 31.0)
        self.assertAlmostEqual(jan_2000["anomaly_pct"], 0.0)

    def test_monthly_indicators_exclude_partial_months(self):
        dates = pd.date_range("2024-01-01", "2024-02-10", freq="D")
        frame = pd.DataFrame({"date": dates, "precip_mm": 1.0})
        result = monthly_indicators(frame, baseline_start=2024, baseline_end=2024, minimum_baseline_years=1)
        self.assertEqual(result["month"].astype(str).tolist(), ["2024-01"])

    def test_climap_aliases_filter_location_and_convert_units(self):
        raw = pd.DataFrame({
            "Date": ["2024-01-01", "2024-01-01"],
            "Municipality": ["Oton", "Passi City"],
            "Rainfall (m)": [0.012, 0.03],
            "Tmax (K)": [303.15, 304.15],
            "Tmin (K)": [293.15, 294.15],
        })
        result = climap_csv_to_frame(raw, location_column="Municipality", location="oton", rainfall_unit="m", temperature_unit="K")
        self.assertEqual(len(result), 1)
        self.assertAlmostEqual(result.loc[0, "precip_mm"], 12)
        self.assertAlmostEqual(result.loc[0, "tmax_c"], 30)

    def test_climap_requires_clear_date_and_rainfall_columns(self):
        with self.assertRaisesRegex(ValueError, "Could not identify date and rainfall"):
            climap_csv_to_frame(pd.DataFrame({"Station": ["Oton"], "Value": [1]}))

    def test_rolling_window_compares_same_date_with_historical_years(self):
        dates = pd.date_range("1991-01-01", "2021-10-02", freq="D")
        rain = pd.Series(1.0, index=dates)
        rain.loc["2021-07-05":"2021-10-02"] = 2.0
        result = rainfall_window_comparison(pd.DataFrame({"date": dates, "precip_mm": rain.values}),
                                            baseline_start=1991, baseline_end=2020)
        self.assertTrue(result["available"])
        self.assertEqual(result["baseline_years"], 30)
        self.assertAlmostEqual(result["current_total_mm"], 180)
        self.assertAlmostEqual(result["normal_total_mm"], 90)
        self.assertAlmostEqual(result["anomaly_pct"], 100)


if __name__ == "__main__":
    unittest.main()
