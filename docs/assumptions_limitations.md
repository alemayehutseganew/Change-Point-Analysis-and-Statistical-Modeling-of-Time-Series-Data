# Assumptions and Limitations

## Key Assumptions
1. **Timeliness of Market Response** – Brent benchmark prices react within 1–3 trading days to major geopolitical or policy announcements, allowing daily granularity to capture structural changes.
2. **Data Integrity** – The historical Brent series from FRED (or ICE) is free from structural revisions that would mimic genuine regime shifts.
3. **Event Dating** – The start dates logged for geopolitical or policy events approximate the moment information became public, acknowledging that execution may lag.
4. **Model Sufficiency** – A single-change (or limited multi-change) Bayesian model with normally distributed observation noise is an adequate first-order description of regime shifts.
5. **Stationarity via Returns** – Log returns are treated as weakly stationary after removing obvious seasonalities, enabling the use of constant-variance likelihoods in the baseline model.

## Limitations
1. **Correlation vs. Causation** – Change point alignment with events establishes temporal correlation only. Demonstrating causality requires structural economic modeling, instrumental variables, or natural experiments not covered in this sprint.
2. **Model Misspecification Risk** – Assuming homoskedastic normal noise may understate fat tails and volatility clustering, biasing parameter estimates around crisis periods.
3. **Event Coverage** – The curated event list may omit regional shocks or financial drivers (currency swings, demand-side collapses) that also influence Brent, leading to attribution gaps.
4. **Data Frequency Mismatch** – Some policy impacts unfold over weeks while the model evaluates daily data, potentially diluting effect sizes.
5. **Multiple Concurrent Events** – Overlapping geopolitical developments complicate attribution because the model does not disentangle simultaneous shocks.
6. **Computational Constraints** – Fully Bayesian multi-change models scale poorly with long histories; simplified models may merge nearby breaks or miss subtle regime shifts.

## Mitigation Strategies
- Perform sensitivity analyses with alternative priors and likelihoods (Student-t, stochastic volatility) to gauge robustness.
- Expand event metadata with confidence scores and lags to capture drawn-out policy implementations.
- Use complementary methods (rolling regressions, GARCH, VAR) in future iterations to triangulate findings.
