/*
 * localStorage.js
 * Helper functions for reading and writing app data to localStorage.
 * All venue and report data is stored here since the app has no backend.
 * Using a single file for all storage operations means there is only
 * one place to update if the storage keys ever change.
 */

// The three keys used to store data in localStorage
export const KEYS = {
  VENUES:  'accessmap_venues',
  REPORTS: 'accessmap_reports',
  META:    'accessmap_meta',
}

// Read all venues from localStorage — returns an empty array if none exist
export function getVenues() {
  try {
    const data = localStorage.getItem(KEYS.VENUES)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to read venues from localStorage:', error)
    return []
  }
}

// Read all reports from localStorage — returns an empty array if none exist
export function getReports() {
  try {
    const data = localStorage.getItem(KEYS.REPORTS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to read reports from localStorage:', error)
    return []
  }
}

// Read the meta object from localStorage — returns an empty object if none exists
export function getMeta() {
  try {
    const data = localStorage.getItem(KEYS.META)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Failed to read meta from localStorage:', error)
    return {}
  }
}

// Save the full venues array to localStorage
export function saveVenues(venues) {
  try {
    localStorage.setItem(KEYS.VENUES, JSON.stringify(venues))
  } catch (error) {
    console.error('Failed to save venues to localStorage:', error)
  }
}

// Save the full reports array to localStorage
export function saveReports(reports) {
  try {
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports))
  } catch (error) {
    console.error('Failed to save reports to localStorage:', error)
  }
}

// Save the meta object to localStorage
export function saveMeta(meta) {
  try {
    localStorage.setItem(KEYS.META, JSON.stringify(meta))
  } catch (error) {
    console.error('Failed to save meta to localStorage:', error)
  }
}

// Returns true if seed data has already been loaded, false otherwise
export function isSeeded() {
  try {
    const meta = getMeta()
    return meta.seeded === true
  } catch (error) {
    return false
  }
}

/*
 * initStorage
 * Called once when the app first loads.
 * If the app has never been opened before, it writes the seed venues
 * to localStorage and marks the app as seeded so this only runs once.
 * User-submitted data added later is never overwritten by this function.
 */
export function initStorage(seedVenues, seedReports) {
  if (isSeeded()) return

  saveVenues(seedVenues)
  saveReports(seedReports)
  saveMeta({
    seeded: true,
    lastUpdated: new Date().toISOString(),
  })
}