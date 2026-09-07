import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = 'http://localhost:3000/api'
const VenuesContext = createContext(null)

export function VenuesProvider({ children }) {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/venues`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch venues')
        return res.json()
      })
      .then(data => {
        setVenues(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  async function addVenue(venueData) {
    const res = await fetch(`${API_BASE}/venues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venueData),
    })
    const result = await res.json()

    if (res.status === 409) return { error: result.error, existing: result.existing }
    if (!res.ok) return { error: result.error || 'Failed to add venue' }

    setVenues(prev => [...prev, result])
    return result
  }

  function getVenueById(id) {
    return venues.find(v => v.id === id) || null
  }

  function getVenueBySlug(slug) {
    return venues.find(v => v.slug === slug) || null
  }

  return (
    <VenuesContext.Provider value={{ venues, loading, error, addVenue, getVenueById, getVenueBySlug }}>
      {children}
    </VenuesContext.Provider>
  )
}

export function useVenues() {
  const ctx = useContext(VenuesContext)
  if (!ctx) throw new Error('useVenues must be used within a VenuesProvider')
  return ctx
}