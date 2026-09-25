import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:3000/api'
// once deployed on Render, swap this to your live URL, e.g.:
// const API_BASE = 'https://your-app.onrender.com/api'

export function useVenues() {

  // Holds all venues in state — starts empty before localStorage is read
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // On first load, seed the data if it has not been seeded yet,
  // then read all venues from localStorage into state
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

    if (res.status === 409) {
      return { error: result.error, existing: result.existing }
    }
    if (!res.ok) {
      return { error: result.error || 'Failed to add venue' }
    }

    setVenues(prev => [...prev, result])
    return result
  }

  /*
   * getVenueById
   * Finds and returns a single venue by its id.
   * Returns null if no match is found.
   */
  function getVenueById(id) {
    return venues.find(v => v.id === id) || null
  }

  function getVenueBySlug(slug) {
    return venues.find(v => v.slug === slug) || null
  }

  return { venues, loading, error, addVenue, getVenueById, getVenueBySlug }
}