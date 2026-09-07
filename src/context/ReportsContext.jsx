import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = 'http://localhost:3000/api'
const ReportsContext = createContext(null)

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/reports`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch reports')
        return res.json()
      })
      .then(data => {
        setReports(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  async function addReport(reportData) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    })
    const result = await res.json()

    if (!res.ok) return { error: result.error || 'Failed to submit report' }

    setReports(prev => [...prev, result])
    return result
  }

  function getReportsByVenueId(venueId) {
    return reports.filter(r => r.venueId === venueId)
  }

  function getAverageRating(venueId) {
    const venueReports = getReportsByVenueId(venueId)
    if (venueReports.length === 0) return null
    const total = venueReports.reduce((sum, r) => sum + r.rating, 0)
    return Math.round((total / venueReports.length) * 10) / 10
  }

  return (
    <ReportsContext.Provider value={{ reports, loading, error, addReport, getReportsByVenueId, getAverageRating }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used within a ReportsProvider')
  return ctx
}