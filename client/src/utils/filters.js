/*
 * filterVenues
 * Takes the full list of venues and reports, applies all active filters,
 * and returns a filtered and sorted array of venues.
 *
 * Parameters:
 *  - venues   {array}   All venues from localStorage
 *  - reports  {array}   All reports from localStorage (needed for rating filters)
 *  - filters  {object}  The current filter state from FilterSidebar.jsx:
 *                       { searchText, area, badges, minRating, sortBy }
 *
 * Returns: a new filtered and sorted array of venue objects.
 *
 * Used by: Directory.jsx
 */
export function filterVenues(venues, reports, filters) {
  const { searchText, area, badges, minRating, sortBy } = filters

  // Start with a copy of all venues so the original array is not mutated
  let results = [...venues]

  // Filter by search text — matches against venue name, area, or category.
  // This allows category pills on the home page to work by passing
  // the category name as the search text e.g. "hospital" or "school".
  if (searchText && searchText.trim() !== '') {
    const query = searchText.toLowerCase()
    results = results.filter(
      v =>
        v.name.toLowerCase().includes(query) ||
        v.area.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query)
    )
  }

  // Filter by Nairobi sub-area — skipped if "All areas" is selected
  if (area && area !== 'All areas') {
    results = results.filter(v => v.area === area)
  }

  // Filter by accessibility badges — only keeps venues that have ALL
  // of the selected badges marked as true. Selecting multiple badges
  // makes the filter stricter, not broader.
  if (badges && badges.length > 0) {
    results = results.filter(v =>
      badges.every(badge => v.accessibility[badge] === true)
    )
  }

  // Filter by minimum star rating — excludes venues with no reports
  // and venues whose average rating falls below the selected minimum.
  if (minRating && minRating > 0) {
    results = results.filter(v => {
      const venueReports = reports.filter(r => r.venueId === v.id)
      if (venueReports.length === 0) return false
      const avg =
        venueReports.reduce((sum, r) => sum + r.rating, 0) /
        venueReports.length
      return avg >= minRating
    })
  }

  // Sort the filtered results based on the selected sort option
  if (sortBy === 'highest-rated') {
    // Sort by average rating from highest to lowest
    results.sort((a, b) => {
      const avgA = getAvg(a.id, reports)
      const avgB = getAvg(b.id, reports)
      return avgB - avgA
    })
  } else if (sortBy === 'most-reports') {
    // Sort by number of community reports from most to least
    results.sort((a, b) => {
      const countA = reports.filter(r => r.venueId === a.id).length
      const countB = reports.filter(r => r.venueId === b.id).length
      return countB - countA
    })
  } else if (sortBy === 'alphabetical') {
    // Sort alphabetically by venue name A to Z
    results.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    // Default sort: most recently added venue first
    results.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
  }

  return results
}

/*
 * getAvg
 * A private helper function that calculates the average star rating
 * for a venue from its reports. Returns 0 if there are no reports,
 * which places unrated venues at the bottom when sorting by highest rated.
 */
function getAvg(venueId, reports) {
  const venueReports = reports.filter(r => r.venueId === venueId)
  if (venueReports.length === 0) return 0
  return venueReports.reduce((sum, r) => sum + r.rating, 0) / venueReports.length
}