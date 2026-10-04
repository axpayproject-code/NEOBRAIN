import json
from io import BytesIO
import unittest
import pandas as pd

from api_server import MAX_UPLOAD_BYTES, analyze_upload, application, dashboard_payload, get_payload


class ApiServerTests(unittest.TestCase):
    def test_empty_dataset_returns_explicit_unloaded_payload(self):
        payload = dashboard_payload(None)
        self.assertFalse(payload["data_loaded"])
        self.assertIsNone(payload["coverage"])
        self.assertEqual(payload["monthly"], [])

    def test_rejects_unsupported_window(self):
        with self.assertRaises(ValueError):
            dashboard_payload(None, window_days=45)

    def test_unknown_path_returns_404(self):
        status, body = get_payload("/not-an-api", {})
        self.assertEqual(status, 404)
        self.assertIn("error", body)

    def test_invalid_window_returns_400(self):
        status, body = get_payload("/api/v1/overview", {"window_days": ["45"]})
        self.assertEqual(status, 400)
        self.assertIn("window_days", body["error"])

    def test_wsgi_health_response_is_json(self):
        response = {}

        def start_response(status, headers):
            response["status"] = status
            response["headers"] = dict(headers)

        result = b"".join(application({"PATH_INFO": "/api/v1/health", "QUERY_STRING": "",
                                        "REQUEST_METHOD": "GET"}, start_response))
        self.assertEqual(response["status"], "200 OK")
        self.assertTrue(response["headers"]["Content-Type"].startswith("application/json"))
        self.assertEqual(json.loads(result)["status"], "ok")

    def test_upload_analyzes_csv_in_memory(self):
        dates = pd.date_range("2025-01-01", periods=400, freq="D")
        csv_text = pd.DataFrame({"date": dates, "precip_mm": [2.0] * len(dates)}).to_csv(index=False)
        body = json.dumps({"filename": "authorized.csv", "csv_text": csv_text, "window_days": 30}).encode()
        status, payload = analyze_upload(body)
        self.assertEqual(status, 200)
        self.assertTrue(payload["data_loaded"])
        self.assertEqual(payload["source"], "Uploaded CSV · authorized.csv")

    def test_upload_size_limit(self):
        status, body = analyze_upload(b"x" * (MAX_UPLOAD_BYTES + 1))
        self.assertEqual(status, 413)
        self.assertIn("10 MB", body["error"])

    def test_wsgi_upload_route_accepts_post(self):
        dates = pd.date_range("2025-01-01", periods=400, freq="D")
        csv_text = pd.DataFrame({"date": dates, "precip_mm": [2.0] * len(dates)}).to_csv(index=False)
        body = json.dumps({"filename": "daily.csv", "csv_text": csv_text}).encode()
        environ = {"PATH_INFO": "/api/v1/analyze", "QUERY_STRING": "", "REQUEST_METHOD": "POST",
                   "CONTENT_LENGTH": str(len(body)), "wsgi.input": BytesIO(body)}
        response = {}

        def start_response(status, headers):
            response["status"] = status

        result = b"".join(application(environ, start_response))
        self.assertEqual(response["status"], "200 OK")
        self.assertTrue(json.loads(result)["data_loaded"])

    def test_overview_payload_uses_validated_daily_rows(self):
        dates = pd.date_range("2025-01-01", periods=400, freq="D")
        frame = pd.DataFrame({"date": dates, "precip_mm": [2.0] * len(dates)})
        payload = dashboard_payload(frame, window_days=30, source="synthetic fixture")
        self.assertTrue(payload["data_loaded"])
        self.assertEqual(payload["coverage"]["rows"], 400)
        self.assertEqual(payload["source"], "synthetic fixture")
        self.assertIsInstance(payload["monthly"], list)
        json.dumps(payload, allow_nan=False)


if __name__ == "__main__":
    unittest.main()
