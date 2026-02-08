# Birhan Energies: Brent Oil Change Point Analysis

## Overview
This project analyzes structural breaks in Brent oil prices (1987–2022) using Bayesian Change Point detection (PyMC). It identifies key regimes associated with geopolitical events (conflicts, OLED policy, etc.) and presents the findings in an interactive dashboard.

## Project Structure
- `data/`: Raw and processed data (Brent prices, Event catalog).
- `docs/`: Analysis plans and assumptions.
- `notebooks/`: Jupyter notebooks for data engineering, EDA, and PyMC modeling.
- `backend/`: Flask API serving model results and data.
- `frontend/`: React + Vite dashboard for visualization.

## Setup & Installation

### 1. Environment
Ensure you have Python 3.10+ and Node.js 18+ installed.

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
The API will run on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The dashboard will run on `http://localhost:5173`.

### 4. Running the Analysis
To regenerate the model results (Task 2):
1. Open `notebooks/brent_changepoint.ipynb`.
2. Run all cells. 
   - This downloads fresh data from FRED.
   - Runs the MCMC sampler (PyMC).
   - Saves `data/analysis_results.json`.

## Methodology
- **Data Source**: FRED (DCOILBRENTEU), daily spot prices.
- **Model**: Bayesian Change Point model with a single switch point (Discrete Uniform prior for $\tau$).
- **Inference**: NUTS sampler via PyMC.

## Key Findings
(See dashboard for latest model run)
- The model detects structural breaks correlating with major supply shocks.
- Volatility clustering is observed during conflict periods (1990, 2011, 2022).
