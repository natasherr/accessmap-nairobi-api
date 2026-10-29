import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarDays, Clock3, MapPin, UsersRound } from 'lucide-react'

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://accessmap-nairobi-api-1.onrender.com/api')
).replace(/\/+$/, '')

function asList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  for (const key of ['data', 'items', 'results', 'rallies']) {
    if (Array.isArray(payload[key])) return payload[key]
  }
  return []
}

function valueOf(record, keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== '') return record[key]
  }
  return null
}

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function locationText(rally) {
  const location = valueOf(rally, [
    'venue_name', 'venueName', 'venue', 'location_name', 'locationName',
    'location', 'event_location', 'eventLocation', 'address',
  ])
  if (typeof location === 'string' || typeof location === 'number') return String(location)
  if (location && typeof location === 'object') {
    return location.name || location.venue_name || location.location || location.address || ''
  }
  return ''
}

function coordinatesOf(record) {
  const point = record.coordinates || record.location || record.venue
  const lat = Number(record.latitude ?? record.lat ?? point?.latitude ?? point?.lat)
  const lng = Number(record.longitude ?? record.lng ?? point?.longitude ?? point?.lng)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

function distanceMeters(a, b) {
  const rad = value => value * Math.PI / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function matchesVenue(rally, venue) {
  const place = normalize(locationText(rally))
  const names = [venue.name, venue.slug, venue.address].map(normalize).filter(Boolean)
  if (place && names.some(name =>
    place === name ||
    (Math.min(place.length, name.length) >= 8 && (place.includes(name) || name.includes(place)))
  )) return true

  const rallyPoint = coordinatesOf(rally)
  const venuePoint = coordinatesOf({ coordinates: venue.coordinates })
  return Boolean(rallyPoint && venuePoint && distanceMeters(rallyPoint, venuePoint) <= 300)
}

function eventDate(rally) {
  return valueOf(rally, ['date', 'event_date', 'eventDate', 'rally_date', 'rallyDate'])
}

function formatDate(dateValue) {
  if (!dateValue) return null
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return String(dateValue)
  return date.toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function upcoming(rally) {
  const rawDate = eventDate(rally)
  if (!rawDate) return true
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date >= today
}

function timeRange(rally) {
  const start = valueOf(rally, ['startTime', 'start_time', 'start'])
  const end = valueOf(rally, ['endTime', 'end_time', 'end'])
  if (start && end) return String(start) + '–' + String(end)
  return start || end || valueOf(rally, ['time', 'event_time', 'eventTime'])
}

function RallyCard({ rally, venue }) {
  const dateLabel = formatDate(eventDate(rally))
  const timeLabel = timeRange(rally)
  const crowd = valueOf(rally, [
    'expectedCrowd', 'expected_crowd', 'crowdEstimate', 'crowd_estimate',
    'attendanceEstimate', 'attendance_estimate',
  ])
  const title = valueOf(rally, ['title', 'name', 'event_name', 'eventName']) || 'Civic event'
  const candidate = valueOf(rally, ['candidate', 'candidate_name', 'candidateName'])
  const party = valueOf(rally, ['party', 'party_name', 'partyName'])
  const organizer = valueOf(rally, ['organizer', 'organiser', 'host', 'host_name', 'hostName'])
  const eventType = valueOf(rally, ['eventType', 'event_type', 'type'])
  const place = locationText(rally) || venue.name

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="h-1 bg-[#1B6B3A]" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            {eventType && (
              <span className="mb-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                {eventType}
              </span>
            )}
            <h3 className="text-sm font-bold leading-snug text-gray-950">{title}</h3>
            {(candidate || party) && (
              <p className="mt-1 text-xs font-medium text-gray-700">
                {candidate}{candidate && party ? ' · ' : ''}{party}
              </p>
            )}
            {organizer && <p className="mt-1 text-xs text-gray-500">Organised by {organizer}</p>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {dateLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-800">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {dateLabel}
            </span>
          )}
          {timeLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-800">
              <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {timeLabel}
            </span>
          )}
          {crowd && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-800">
              <UsersRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Expected: {crowd}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-700">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
          <span className="truncate">{place}</span>
        </div>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3" role="note">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-950">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
            Accessibility advisory
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900">
            Expect crowds and possible delays around entrances, parking, and accessible routes.
            Check with the venue before travelling if you need specific accessibility arrangements.
          </p>
        </div>
      </div>
    </article>
  )
}

export default function VoterEduPanel({ venue }) {
  const [rallies, setRallies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadRallies() {
      setLoading(true)
      setError(false)
      try {
        const response = await fetch(API_BASE + '/partner/rallies')
        if (!response.ok) throw new Error('Partner rally request failed')
        const payload = await response.json()
        if (!cancelled) setRallies(asList(payload))
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadRallies()
    return () => { cancelled = true }
  }, [])

  const venueRallies = rallies
    .filter(rally => matchesVenue(rally, venue) && upcoming(rally))
    .sort((a, b) => new Date(eventDate(a) || 0) - new Date(eventDate(b) || 0))

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Upcoming events at {venue.name}</h2>
            <p className="mt-0.5 text-xs text-gray-500">Plan ahead for gatherings at this location.</p>
          </div>
          {!loading && !error && venueRallies.length > 0 && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
              {venueRallies.length} upcoming event{venueRallies.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="grid gap-3" aria-label="Loading rally information">
            {[0, 1].map(item => (
              <div key={item} className="h-32 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Rally information is temporarily unavailable. Please try again later.
          </p>
        ) : venueRallies.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            No upcoming rallies are currently listed for this venue.
          </p>
        ) : (
          <div className="grid gap-4">
            {venueRallies.map((rally, index) => (
              <RallyCard
                key={rally.id || rally.slug || venue.slug + '-rally-' + index}
                rally={rally}
                venue={venue}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
