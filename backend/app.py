from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import json
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
DATA_DIR = Path("../data").resolve()
RESULTS_PATH = DATA_DIR / "analysis_results.json"
EVENTS_PATH = DATA_DIR / "events_catalog.csv"

def load_results():
    if not RESULTS_PATH.exists():
        return None
    with open(RESULTS_PATH, "r") as f:
        return json.load(f)

def load_prices(csv_path):
    if not os.path.exists(csv_path):
        return None
    df = pd.read_csv(csv_path)
    return df.to_dict(orient="records")

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "backend": "running"})

@app.route("/api/analysis", methods=["GET"])
def get_analysis_results():
    results = load_results()
    if not results:
        return jsonify({"error": "Analysis results not found. Please run the notebook first."}), 404
    return jsonify(results)

@app.route("/api/prices", methods=["GET"])
def get_prices():
    results = load_results()
    if not results:
       # Fallback to finding the latest CSV if results.json doesn't exist yet
       csv_files = sorted(DATA_DIR.glob("brent_prices_*.csv"), reverse=True)
       if not csv_files:
           return jsonify({"error": "No price data found"}), 404
       price_file = csv_files[0]
    else:
        # Use the specific file from the analysis run
        price_file = list(DATA_DIR.glob("brent_prices_*.csv"))[0] # Fallback logic simplified

    df = pd.read_csv(price_file)
    # Return a subset to keep payload light for demo, or full set
    # Let's return the full set but optimized
    data = df.tail(2000).to_dict(orient="records") # Last ~8 years
    return jsonify(data)

@app.route("/api/events", methods=["GET"])
def get_events():
    if not EVENTS_PATH.exists():
        return jsonify({"error": "Events catalog not found"}), 404
    df = pd.read_csv(EVENTS_PATH)
    return jsonify(df.to_dict(orient="records"))

if __name__ == "__main__":
    app.run(debug=True, port=5000)
