import { useState, useEffect } from 'react'
import { getReports, saveReports } from '../utils/localStorage'

/*
 * useReports
 * A custom React hook that manages all community report data.
 * Reads reports from localStorage on first load and provides functions
 * to add new reports and query reports by venue.
 *
 * Returns:
 *  - reports              {array}     All reports currently in localStorage
 *  - addReport            {function}  Saves a new report to localStorage
 *  - getReportsByVenueId  {function}  Returns all reports for a specific venue
 *  - getAverageRating     {function}  Returns the average star rating for a venue
 *
 * Used by: VenueDetail.jsx, ReportForm.jsx, Directory.jsx
 */
export function useReports() {

  // Holds all reports in state — starts empty before localStorage is read
  const [reports, setReports] = useState([])

  // Load all reports from localStorage when the hook is first used
  useEffect(() => {
    const stored = getReports()
    setReports(stored)
  }, [])

  /*
   * addReport
   * Creates a new report object with a unique id and a submission timestamp,
   * saves it to localStorage, and updates the local state so the UI
   * reflects the new report immediately without a page refresh.
   */
  function addReport(reportData) {
    const newReport = {
      ...reportData,
      id: 'r_' + Date.now(),           // unique id based on current timestamp
      submittedAt: new Date().toISOString(),
    }
    const updated = [...reports, newReport]
    saveReports(updated)
    setReports(updated)
    return newReport
  }

  /*
   * getReportsByVenueId
   * Filters the reports array to return only the reports
   * that belong to a specific venue.
   */
  function getReportsByVenueId(venueId) {
    return reports.filter(r => r.venueId === venueId)
  }

  /*
   * getAverageRating
   * Calculates the average star rating for a venue from all its reports.
   * Rounded to one decimal place e.g. 3.666 becomes 3.7.
   * Returns null if the venue has no reports yet.
   */
  function getAverageRating(venueId) {
    const venueReports = getReportsByVenueId(venueId)
    if (venueReports.length === 0) return null
    const total = venueReports.reduce((sum, r) => sum + r.rating, 0)
    return Math.round((total / venueReports.length) * 10) / 10
  }

  return { reports, addReport, getReportsByVenueId, getAverageRating }
}