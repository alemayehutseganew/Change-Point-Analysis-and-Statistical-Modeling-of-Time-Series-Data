# Birhan Energies – Brent Oil Change Point Study

## 1. Objectives
- Map statistically significant structural breaks in Brent spot prices (1987–2022) and pair them with geopolitical / macro events.
- Quantify pre/post regime parameters (mean, volatility) using a Bayesian change point model in PyMC.
- Translate evidence into clear narratives for investors, policymakers, and energy operators through a notebook report and dashboard.

## 2. Data Sources & Engineering
| Dataset | Purpose | Prep Steps |
| --- | --- | --- |
| Brent daily spot prices (FRED: `DCOILBRENTEU`) | Core target series | Download via `pandas_datareader`, coerce to datetime index, forward-fill sporadic missing days, convert to USD/barrel float |
| Event log (custom CSV in `data/events_catalog.csv`) | Anchor change points to real-world catalysts | Curate ≥15 major political, OPEC, conflict, and financial events with onset dates, category, narrative |
| Optional macro covariates (ICE futures curves, USD index, inflation, GDP) | Stress testing advanced models | Align frequency (daily/weekly), z-score, and join on calendar date |

## 3. Analysis Workflow
1. **Ingestion & QA** – Load Brent prices, verify coverage (1987-05-20 … 2022-09-30), inspect missing data, create trading-day index.
2. **Feature Engineering** – Compute log returns, rolling volatility (30d, 90d), and cumulative drawdowns; align event flags around ±30-day windows.
3. **Exploratory Analysis** –
   - Trend decomposition (HP filter / STL) and visual inspection for large swings to decide whether to work on levels or log returns.
   - Stationarity diagnostics (ADF, KPSS) on price and log returns; document which transformation (differencing vs. returns) passes the tests.
   - Volatility clustering review via rolling standard deviation plots and ARCH-LM tests to justify heavier-tailed likelihoods.
   - Event alignment study leveraging `data/events_catalog.csv` to pre-label ±30-day windows for later causal narratives.
4. **Bayesian Change Point Modeling** –
   - Baseline single-switch PyMC model with discrete `tau`, separate means (`mu1`, `mu2`) and shared sigma.
   - Extend to multiple change points via `pm.Dirichlet`-based hazard if time permits.
   - Run MCMC (NUTS) with robust priors; monitor R-hat, ESS, energy plots.
5. **Posterior Analysis** – Extract posterior of `tau`, compute probability mass for event windows, quantify mean shifts (Δμ) and percent changes.
6. **Causality Narrative** – Cross-reference with curated events, articulate hypotheses (correlation ≠ causation), and document confidence.
7. **Communication Layer** – Notebook storytelling, executive-ready PDF/blog, and interactive Flask + React dashboard exposing time-series, posterior summaries, and event overlays.

## 4. Event Research Plan
- Sources: EIA briefs, OPEC press releases, UN/World Bank reports, Reuters/FT archives.
- Criteria: Global relevance, documented market reaction, precise start date, linkage to supply/demand shocks.
- Structure: `Date`, `Event_Name`, `Category (Conflict | Policy | Economic | Supply)`, `Description`, `Hypothesized_Impact`.

## 5. Model & Concept Checks
- **Change Point Purpose** – Detect regimes where statistical properties (mean/volatility) shift, indicating structural change in the price formation process.
- **Expected Outputs** – Posterior over `tau`, parameter estimates before/after, probability of each day being a change point, and predictive distributions. Limitations include sensitivity to prior choices, assumption of single global break, and inability to prove causality.
- **Time-Series Properties** –
   - *Trend*: Long cycles tied to macro regimes; STL/HP outputs flag whether deterministic trend removal is necessary before fitting the Bayesian model.
   - *Stationarity*: Prices typically non-stationary; ADF/KPSS on log returns confirms (or rejects) weak stationarity, dictating whether to feed differences/returns into the model.
   - *Volatility*: Rolling variance plus ARCH effects reveal clustering, motivating Student-t likelihoods or stochastic volatility extensions if normal noise underfits crises.
   - Collectively, these diagnostics define the preprocessing branch (levels vs. returns), prior scaling, and whether to embed volatility parameters inside the PyMC graph.

## 6. Assumptions & Limitations
- Politico-economic events affect supply/demand swiftly enough for daily data to capture impacts.
- Public Brent benchmarks reflect fundamental shocks despite speculative noise.
- Event dates approximate the information release; actual market assimilation may lag.
- Statistical change detection supplies correlation in time. Demonstrating causality demands structural economic modeling or natural experiments, which are outside scope for Week 11. Findings must therefore be framed as "consistent with" rather than definitive proof.

## 7. Communication Channels
| Audience | Medium | Cadence |
| --- | --- | --- |
| Internal mentors (Kerod, Filimon, Mahbubah) | Slack `#all-week11`, shared Google Doc for interim notes | Daily async updates, office hours Q&A |
| Investors | Executive summary PDF, change-point snapshot slides, dashboard walkthrough (Zoom) | Interim (Feb 8) and final (Feb 10) |
| Policymakers | Policy memo (2–4 pages) with key dates and confidence notes, dashboard export | Interim and final |
| Energy companies (traders/ops) | Ops brief with timeline of supply shocks, interactive dashboard with event overlays | Weekly while active, final handoff |
| Engineering peers | GitHub Issues/Projects, README updates | Continuous |

## 8. Tooling & References
- **Core stack**: Python 3.11, pandas, numpy, PyMC 5, ArviZ, Bokeh/Plotly, Flask, React + Vite.
- **Key references reviewed** –
   - Hyndman & Athanasopoulos (FPP3, Ch. 8–9): clarified decomposition choices and stationarity diagnostics feeding into the preprocessing branch.
   - PyMC Dev Guide: Change point modeling tutorial ("Switchpoint" example) informs prior selection on `tau` and sampling diagnostics to watch (energy/BFMI).
   - Steel (2023) on Bayesian structural breaks plus Ardia et al. (2018) on volatility regime switches: highlight limitations of homoskedastic assumptions and motivate Student-t/stochastic volatility variants for crisis periods.

_All timelines respect: Interim deliverable (Sun 08 Feb 20:00 UTC) covering Task 1 assets; final submission (Tue 10 Feb 20:00 UTC) with full modeling + dashboard._
