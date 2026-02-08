# Change-Point Model Summary

## Model Overview
This project uses a single change-point Bayesian model to detect a regime shift in Brent prices. The model assumes the price series switches from one mean level to another at an unknown date $\tau$ and estimates separate means before and after the switch with a shared noise scale.

## Priors (baseline)
- Change point: $\tau \sim \text{DiscreteUniform}(1, T)$ over all dates in the series.
- Means: $\mu_1, \mu_2 \sim \mathcal{N}(\bar{y}, 2\,s_y)$ where $\bar{y}$ and $s_y$ are the empirical mean and standard deviation of the observed prices.
- Noise scale: $\sigma \sim \text{HalfNormal}(s_y)$ to keep the standard deviation positive and scaled to the data.

## Likelihood
- For $t \le \tau$: $y_t \sim \mathcal{N}(\mu_1, \sigma)$
- For $t > \tau$: $y_t \sim \mathcal{N}(\mu_2, \sigma)$

## Expected Outputs
- Posterior distribution of $\tau$ and a most-likely change date.
- Posterior summaries for $\mu_1$, $\mu_2$, and $\sigma$.
- Derived mean shift (absolute and percent change) across regimes.
- Event alignment summary: events closest to the posterior mode of $\tau$.

## Notes
This summary documents the baseline change-point model used in the notebook. Future extensions may include multiple change points or volatility-focused likelihoods (Student-t or stochastic volatility).