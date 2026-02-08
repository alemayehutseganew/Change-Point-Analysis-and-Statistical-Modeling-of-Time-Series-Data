"""Flask API for serving Brent change-point analysis artifacts."""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
DATA_DIR = Path(os.environ.get("BRENT_DATA_DIR", "../data")).resolve()
RESULTS_FILENAME = "analysis_results.json"
EVENTS_FILENAME = "events_catalog.csv"
PRICE_GLOB = "brent_prices_*.csv"

RESULTS_PATH = DATA_DIR / RESULTS_FILENAME
EVENTS_PATH = DATA_DIR / EVENTS_FILENAME

def load_results() -> Optional[Dict[str, Any]]:
    """Load analysis results JSON from disk if it exists."""
    if not RESULTS_PATH.exists():
        return None
    with open(RESULTS_PATH, "r") as f:
        return json.load(f)


def resolve_price_file(results: Optional[Dict[str, Any]]) -> Optional[Path]:
    """Resolve the price CSV to serve based on results metadata or latest file."""
    if results:
        csv_path = results.get("data_files", {}).get("csv")
        if csv_path and Path(csv_path).exists():
            return Path(csv_path)

    csv_files = sorted(DATA_DIR.glob(PRICE_GLOB), reverse=True)
    if csv_files:
        return csv_files[0]
    return None


def load_prices_frame(price_file: Path) -> Tuple[pd.DataFrame, Optional[str]]:
    """Read a price CSV into a DataFrame, returning error details if any."""
    try:
        df = pd.read_csv(price_file)
        df, err = normalize_prices_frame(df)
        return df, err
    except Exception as exc:  # pragma: no cover - defensive guard
        return pd.DataFrame(), str(exc)


def normalize_prices_frame(df: pd.DataFrame) -> Tuple[pd.DataFrame, Optional[str]]:
    """Validate and normalize the price DataFrame shape."""
    if "Date" not in df.columns or "Price" not in df.columns:
        return pd.DataFrame(), "Price file must include Date and Price columns."

    cleaned = df.copy()
    cleaned["Date"] = pd.to_datetime(cleaned["Date"], errors="coerce")
    cleaned["Price"] = pd.to_numeric(cleaned["Price"], errors="coerce")
    cleaned = cleaned.dropna(subset=["Date", "Price"]).sort_values("Date")
    cleaned["Date"] = cleaned["Date"].dt.strftime("%Y-%m-%d")
    return cleaned, None


def parse_date_param(param_name: str) -> Tuple[Optional[pd.Timestamp], Optional[str]]:
    """Parse an ISO date query parameter if present."""
    value = request.args.get(param_name)
    if not value:
        return None, None
    try:
        return pd.to_datetime(value), None
    except Exception:
        return None, f"Invalid {param_name} date: {value}. Use YYYY-MM-DD."

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "backend": "running",
            "data_dir": str(DATA_DIR),
            "has_results": RESULTS_PATH.exists(),
        }
    )

@app.route("/api/analysis", methods=["GET"])
def get_analysis_results():
    results = load_results()
    if not results:
        return jsonify({"error": "Analysis results not found. Please run the notebook first."}), 404
    return jsonify(results)

@app.route("/api/prices", methods=["GET"])
def get_prices():
    results = load_results()
    price_file = resolve_price_file(results)
    if not price_file:
        return jsonify({"error": "No price data found"}), 404

    df, err = load_prices_frame(price_file)
    if err:
        return jsonify({"error": "Failed to read price data", "detail": err}), 500

    start_date, start_err = parse_date_param("start")
    if start_err:
        return jsonify({"error": start_err}), 400
    end_date, end_err = parse_date_param("end")
    if end_err:
        return jsonify({"error": end_err}), 400

    if start_date is not None or end_date is not None:
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        if start_date is not None:
            df = df[df["Date"] >= start_date]
        if end_date is not None:
            df = df[df["Date"] <= end_date]
        df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")

    limit = request.args.get("limit", default=2000, type=int)
    limit = max(1, min(limit, 10000))
    data = df.tail(limit).to_dict(orient="records")
    return jsonify(data)

@app.route("/api/events", methods=["GET"])
def get_events():
    if not EVENTS_PATH.exists():
        return jsonify({"error": "Events catalog not found"}), 404
    df = pd.read_csv(EVENTS_PATH).sort_values("Date")
    return jsonify(df.to_dict(orient="records"))

if __name__ == "__main__":
    app.run(debug=True, port=5000)
