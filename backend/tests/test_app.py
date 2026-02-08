import json
from pathlib import Path

import pandas as pd
import pytest

import backend.app as app_module


@pytest.fixture()
def client(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    monkeypatch.setattr(app_module, "DATA_DIR", data_dir)
    monkeypatch.setattr(app_module, "RESULTS_PATH", data_dir / app_module.RESULTS_FILENAME)
    monkeypatch.setattr(app_module, "EVENTS_PATH", data_dir / app_module.EVENTS_FILENAME)

    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as test_client:
        yield test_client


def write_prices(csv_path: Path):
    df = pd.DataFrame(
        {
            "Date": ["2020-01-01", "2020-01-02", "2020-01-03"],
            "Price": [55.2, 56.8, 54.9],
        }
    )
    df.to_csv(csv_path, index=False)


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_analysis_missing(client):
    response = client.get("/api/analysis")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_prices_missing(client):
    response = client.get("/api/prices")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_prices_from_results(client, tmp_path):
    csv_path = tmp_path / "data" / "brent_prices_20200101_000000.csv"
    write_prices(csv_path)

    results = {
        "data_files": {
            "csv": str(csv_path)
        }
    }
    with open(tmp_path / "data" / "analysis_results.json", "w") as f:
        json.dump(results, f)

    response = client.get("/api/prices?limit=2")
    assert response.status_code == 200
    payload = response.get_json()
    assert len(payload) == 2
    assert payload[-1]["Price"] == 54.9


def test_events_missing(client):
    response = client.get("/api/events")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_events_ok(client, tmp_path):
    events_path = tmp_path / "data" / "events_catalog.csv"
    events_path.write_text(
        "Date,Event_Name,Category,Description,Hypothesized_Impact\n"
        "2020-01-01,Test Event,Policy,Desc,Impact\n"
    )

    response = client.get("/api/events")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload[0]["Event_Name"] == "Test Event"
