import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

function App() {
  const [analysis, setAnalysis] = useState(null)
  const [prices, setPrices] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analysisRes, pricesRes, eventsRes] = await Promise.allSettled([
          axios.get('/api/analysis'),
          axios.get('/api/prices'),
          axios.get('/api/events')
        ])

        if (analysisRes.status === 'fulfilled') setAnalysis(analysisRes.value.data)
        if (pricesRes.status === 'fulfilled') setPrices(pricesRes.value.data)
        if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="container">Loading Dashboard...</div>

  return (
    <div className="container">
      <header>
        <h1>Birhan Energies: Brent Oil Dashboard</h1>
        <p>Bayesian Change Point Analysis & Event Correlation</p>
      </header>
      
      <div className="dashboard-grid">
        
        {/* Model Results Card */}
        <div className="card">
          <h2>Change Point Detection</h2>
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
            </div>
          ) : (
            <p>Model analysis not yet available. Please run the notebook.</p>
          )}
        </div>

        {/* Chart Card */}
        <div className="card" style={{height: '500px'}}>
          <h2>Price History & Events</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prices}>
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

              {/* Event Lines (Optional - could be cluttered) */}
              {/* 
              {events.map((evt, idx) => (
                <ReferenceLine key={idx} x={evt.Date} stroke="green" opacity={0.3} />
              ))} 
              */}
            </LineChart>
          </ResponsiveContainer>
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
                {events.slice(0, 10).map((evt, idx) => (
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
