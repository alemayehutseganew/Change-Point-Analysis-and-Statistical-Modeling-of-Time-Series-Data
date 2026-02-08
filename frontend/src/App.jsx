import { useMemo, useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

function App() {
  const [analysis, setAnalysis] = useState(null)
  const [prices, setPrices] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEvents, setShowEvents] = useState(false)
  const [errors, setErrors] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analysisRes, pricesRes, eventsRes] = await Promise.allSettled([
          axios.get('/api/analysis'),
          axios.get('/api/prices?limit=2500'),
          axios.get('/api/events')
        ])

        const nextErrors = []
        if (analysisRes.status === 'fulfilled') setAnalysis(analysisRes.value.data)
        else nextErrors.push('Analysis results unavailable (run the notebook).')

        if (pricesRes.status === 'fulfilled') setPrices(pricesRes.value.data)
        else nextErrors.push('Price data unavailable.')

        if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data)
        else nextErrors.push('Events catalog unavailable.')

        setErrors(nextErrors)
      } catch (error) {
        console.error("Error fetching data:", error)
        setErrors(['Failed to connect to the API.'])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!prices.length) return
    if (!startDate) setStartDate(prices[0]?.Date ?? '')
    if (!endDate) setEndDate(prices[prices.length - 1]?.Date ?? '')
  }, [prices, startDate, endDate])

  const eventCategories = useMemo(() => {
    const unique = new Set(events.map((evt) => evt.Category).filter(Boolean))
    return ['All', ...Array.from(unique).sort()]
  }, [events])

  const filteredPrices = useMemo(() => {
    if (!prices.length) return []
    return prices.filter((row) => {
      if (startDate && row.Date < startDate) return false
      if (endDate && row.Date > endDate) return false
      return true
    })
  }, [prices, startDate, endDate])

  const filteredEvents = useMemo(() => {
    if (!events.length) return []
    return events.filter((evt) => {
      if (selectedCategory !== 'All' && evt.Category !== selectedCategory) return false
      if (startDate && evt.Date < startDate) return false
      if (endDate && evt.Date > endDate) return false
      return true
    })
  }, [events, selectedCategory, startDate, endDate])

  const priceSummary = useMemo(() => {
    if (!filteredPrices.length) return null
    const first = filteredPrices[0]
    const last = filteredPrices[filteredPrices.length - 1]
    const values = filteredPrices.map((row) => row.Price).filter((v) => Number.isFinite(v))
    const min = Math.min(...values)
    const max = Math.max(...values)
    return {
      start: first?.Date,
      end: last?.Date,
      min,
      max,
      count: filteredPrices.length
    }
  }, [filteredPrices])

  const closestEvent = useMemo(() => {
    if (!analysis?.tau_date || !events.length) return null
    const tau = new Date(analysis.tau_date)
    const ranked = events
      .map((evt) => ({
        ...evt,
        diff: Math.abs(new Date(evt.Date) - tau)
      }))
      .filter((evt) => Number.isFinite(evt.diff))
      .sort((a, b) => a.diff - b.diff)
    return ranked[0] || null
  }, [analysis, events])

  const eventMatches = useMemo(() => {
    if (!analysis?.event_matches) return []
    return analysis.event_matches
  }, [analysis])

  const stationaritySummary = useMemo(() => {
    if (!analysis?.stationarity) return null
    if (analysis.stationarity.error) return analysis.stationarity.error
    const adfP = analysis.stationarity.adf_pvalue
    const kpssP = analysis.stationarity.kpss_pvalue
    return `ADF p=${adfP?.toFixed?.(4) ?? adfP}, KPSS p=${kpssP?.toFixed?.(4) ?? kpssP}`
  }, [analysis])

  if (loading) return <div className="container">Loading Dashboard...</div>

  return (
    <div className="container">
      <header>
        <h1>Birhan Energies: Brent Oil Dashboard</h1>
        <p>Bayesian Change Point Analysis & Event Correlation</p>
      </header>
      
      <div className="dashboard-grid">

        {/* Filters */}
        <div className="card span-2">
          <h2>Filters</h2>
          <div className="filter-bar">
            <div className="filter-group">
              <label htmlFor="start-date">Start date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="end-date">End date</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="category-filter">Event category</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {eventCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="sr-only" htmlFor="reset-filters">Reset</label>
              <button
                id="reset-filters"
                type="button"
                onClick={() => {
                  setStartDate(prices[0]?.Date ?? '')
                  setEndDate(prices[prices.length - 1]?.Date ?? '')
                  setSelectedCategory('All')
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="filter-meta">
            Showing {filteredPrices.length.toLocaleString()} price points and {filteredEvents.length.toLocaleString()} events
          </div>
        </div>
        
        {/* Model Results Card */}
        <div className="card">
          <h2>Change Point Detection</h2>
          {errors.length > 0 && (
            <div className="alert">
              {errors.map((msg, idx) => (
                <div key={idx}>{msg}</div>
              ))}
            </div>
          )}
          {analysis ? (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
              <div className="stat-box">
                <div className="stat-label">Most Likely Change Date</div>
                <div className="stat-value" style={{color: '#ff6b6b'}}>{analysis.tau_date}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Mean Price Before</div>
                <div className="stat-value">${analysis.mu_before?.toFixed(2)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Mean Price After</div>
                <div className="stat-value">${analysis.mu_after?.toFixed(2)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Shift Magnitude</div>
                <div className="stat-value">{analysis.mean_shift_pct?.toFixed(2)}%</div>
              </div>
              {closestEvent && (
                <div className="stat-box">
                  <div className="stat-label">Closest Catalog Event</div>
                  <div className="stat-value" style={{fontSize: '1em'}}>
                    {closestEvent.Event_Name} ({closestEvent.Date})
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>Model analysis not yet available. Please run the notebook.</p>
          )}
        </div>

        {/* Chart Card */}
        <div className="card span-2" style={{height: '500px'}}>
          <h2>Price History & Events</h2>
          <div className="toolbar">
            <label>
              <input
                type="checkbox"
                checked={showEvents}
                onChange={(event) => setShowEvents(event.target.checked)}
              />
              Show event markers
            </label>
            {priceSummary && (
              <div className="meta">
                {priceSummary.start} → {priceSummary.end} · {priceSummary.count.toLocaleString()} points
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredPrices}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="Date" 
                tickFormatter={(str) => str.split('-')[0]} 
                minTickGap={30}
              />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{backgroundColor: '#333', border: 'none'}}
                labelStyle={{color: '#ccc'}}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Price" 
                stroke="#8884d8" 
                dot={false} 
                strokeWidth={1.5}
                name="Brent Price (USD)"
              />
              
              {/* Change Point Line */}
              {analysis && (
                <ReferenceLine 
                  x={analysis.tau_date} 
                  stroke="red" 
                  strokeDasharray="5 5"
                  label={{ position: 'top', value: 'Detected Shift', fill: 'red' }} 
                />
              )}

              {showEvents && filteredEvents.map((evt, idx) => (
                <ReferenceLine key={idx} x={evt.Date} stroke="#4caf50" opacity={0.2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Data Quality & Diagnostics */}
        <div className="card">
          <h2>Data Quality & Diagnostics</h2>
          {analysis ? (
            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-label">Coverage</div>
                <div className="metric-value">
                  {analysis.data_quality?.coverage_start} → {analysis.data_quality?.coverage_end}
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Missing Prices</div>
                <div className="metric-value">{analysis.data_quality?.missing_price ?? '—'}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Missing Log Returns</div>
                <div className="metric-value">{analysis.data_quality?.missing_log_return ?? '—'}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Duplicate Dates</div>
                <div className="metric-value">{analysis.data_quality?.duplicate_dates ?? '—'}</div>
              </div>
              <div className="metric span-2">
                <div className="metric-label">Stationarity Tests</div>
                <div className="metric-value">{stationaritySummary ?? 'Not available'}</div>
              </div>
            </div>
          ) : (
            <p>Run the notebook to populate diagnostics.</p>
          )}
        </div>

        {/* Top Event Matches */}
        <div className="card">
          <h2>Closest Events to Detected Shift</h2>
          {eventMatches.length ? (
            <div style={{overflowX: 'auto'}}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Days From Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {eventMatches.map((evt, idx) => (
                    <tr key={idx}>
                      <td>{evt.Date}</td>
                      <td>{evt.Event_Name}</td>
                      <td>{evt.Category}</td>
                      <td>{evt.Days_From_Tau}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Event match table will appear after running the notebook.</p>
          )}
        </div>

        {/* Events Table Card */}
        <div className="card">
          <h2>Event Catalog</h2>
          <div style={{overflowX: 'auto'}}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Impact Hypothesis</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.slice(0, 12).map((evt, idx) => (
                  <tr key={idx}>
                    <td>{evt.Date}</td>
                    <td>{evt.Event_Name}</td>
                    <td><span style={{
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8em',
                      backgroundColor: evt.Category === 'Conflict' ? '#632' : '#236'
                    }}>{evt.Category}</span></td>
                    <td>{evt.Hypothesized_Impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
