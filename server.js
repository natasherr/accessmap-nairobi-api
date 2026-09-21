import express from 'express';
import cors from 'cors';
import { PrismaClient } from './src/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedVenues } from './src/data/seedVenues.js';
import { seedReports } from './src/data/seedReports.js';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function ensureSeeded() {
  const venueCount = await prisma.venue.count();
  if (venueCount === 0) {
    const data = seedVenues.map(v => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      area: v.area,
      address: v.address,
      category: v.category,
      ramp: v.accessibility.ramp,
      lift: v.accessibility.lift,
      accessibleToilet: v.accessibility.accessibleToilet,
      accessibleParking: v.accessibility.accessibleParking,
      tactilePaving: v.accessibility.tactilePaving,
      wideCorridors: v.accessibility.wideCorridors,
      audioAssistance: v.accessibility.audioAssistance,
      staffAssistance: v.accessibility.staffAssistance,
      lat: v.coordinates.lat,
      lng: v.coordinates.lng,
      addedAt: new Date(v.addedAt),
      isSeeded: v.isSeeded,
    }));
    await prisma.venue.createMany({ data, skipDuplicates: true });
    console.log(`Seeded ${data.length} venues.`);
  }

  const reportCount = await prisma.report.count();
  if (reportCount === 0) {
    const data = seedReports.map(r => ({
      id: r.id,
      venueId: r.venueId,
      rating: r.rating,
      description: r.description,
      visitedAt: r.visitedAt,
      submittedAt: new Date(r.submittedAt),
      ramp: r.accessibility.ramp,
      lift: r.accessibility.lift,
      accessibleToilet: r.accessibility.accessibleToilet,
      accessibleParking: r.accessibility.accessibleParking,
      tactilePaving: r.accessibility.tactilePaving,
      wideCorridors: r.accessibility.wideCorridors,
      audioAssistance: r.accessibility.audioAssistance,
      staffAssistance: r.accessibility.staffAssistance,
    }));
    await prisma.report.createMany({ data, skipDuplicates: true });
    console.log(`Seeded ${data.length} reports.`);
  }
}

// Reshapes a database row into exactly what openapi.yaml's Venue schema
// promises. isSeeded is intentionally NOT included — it's an internal
// DB-only field the contract never mentioned (see CONTRACT_DEVIATIONS.md).
function reshapeVenue(v) {
  return {
    id: v.id,
    slug: v.slug,
    name: v.name,
    area: v.area,
    address: v.address,
    category: v.category,
    accessibility: {
      ramp: v.ramp,
      lift: v.lift,
      accessibleToilet: v.accessibleToilet,
      accessibleParking: v.accessibleParking,
      tactilePaving: v.tactilePaving,
      wideCorridors: v.wideCorridors,
      audioAssistance: v.audioAssistance,
      staffAssistance: v.staffAssistance,
    },
    coordinates: { lat: v.lat, lng: v.lng },
    addedAt: v.addedAt,
  };
}

// Matches the Report schema exactly — used by POST /api/reports's response.
function reshapeReport(r) {
  return {
    id: r.id,
    venueId: r.venueId,
    rating: r.rating,
    description: r.description,
    visitedAt: r.visitedAt,
    submittedAt: r.submittedAt,
    accessibility: {
      ramp: r.ramp,
      lift: r.lift,
      accessibleToilet: r.accessibleToilet,
      accessibleParking: r.accessibleParking,
      tactilePaving: r.tactilePaving,
      wideCorridors: r.wideCorridors,
      audioAssistance: r.audioAssistance,
      staffAssistance: r.staffAssistance,
    },
  };
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const app = express();
app.use(cors());
app.use(express.json());

// ── Venues ──

// GET /api/venues
// Contract: supports ?category=, ?area=, ?accessible= (boolean) query params
app.get('/api/venues', async (req, res) => {
  const { category, area, accessible } = req.query;

  const where = {};
  if (category) where.category = category;
  if (area) where.area = area;
  if (accessible === 'true') {
    where.ramp = true;
    where.accessibleToilet = true;
    where.accessibleParking = true;
  }

  const venues = await prisma.venue.findMany({ where });
  res.json(venues.map(reshapeVenue));
});

// GET /api/venues/:slug
app.get('/api/venues/:slug', async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { slug: req.params.slug } });
  if (!venue) return res.status(404).json({ error: 'Not found' });
  res.json(reshapeVenue(venue));
});

// GET /api/venues/:slug/rating
app.get('/api/venues/:slug/rating', async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { slug: req.params.slug } });
  if (!venue) return res.status(404).json({ error: 'Not found' });

  const reports = await prisma.report.findMany({ where: { venueId: venue.id } });
  const totalReports = reports.length;
  const averageRating = totalReports === 0
    ? 0
    : Math.round((reports.reduce((sum, r) => sum + r.rating, 0) / totalReports) * 10) / 10;

  res.json({
    slug: venue.slug,
    averageRating,
    totalReports,
  });
});

// POST /api/venues
// Checks that an accessibility object has all 8 required boolean keys.
// Returns an error message string if invalid, or null if valid.
function validateAccessibility(acc) {
  const keys = ['ramp', 'lift', 'accessibleToilet', 'accessibleParking',
                'tactilePaving', 'wideCorridors', 'audioAssistance', 'staffAssistance'];
  if (!acc || typeof acc !== 'object') return 'accessibility object is required';
  for (const key of keys) {
    if (typeof acc[key] !== 'boolean') return `accessibility.${key} must be a boolean`;
  }
  return null;
}

// POST /api/venues
app.post('/api/venues', async (req, res) => {
  const v = req.body;

  // ── Validation first — nothing gets written until every check passes ──
  if (!v.name || typeof v.name !== 'string') {
    return res.status(400).json({ error: 'name is required and must be a string' });
  }
  if (!v.area || typeof v.area !== 'string') {
    return res.status(400).json({ error: 'area is required and must be a string' });
  }
  if (!v.address || typeof v.address !== 'string') {
    return res.status(400).json({ error: 'address is required and must be a string' });
  }
  if (!v.category || typeof v.category !== 'string') {
    return res.status(400).json({ error: 'category is required and must be a string' });
  }
  const accError = validateAccessibility(v.accessibility);
  if (accError) return res.status(400).json({ error: accError });

  if (!v.coordinates || typeof v.coordinates.lat !== 'number' || typeof v.coordinates.lng !== 'number') {
    return res.status(400).json({ error: 'coordinates.lat and coordinates.lng are required numbers' });
  }

  // ── Only now do we touch the database ──
  try {
    const duplicate = await prisma.venue.findFirst({
      where: { name: v.name, area: v.area },
    });
    if (duplicate) {
      return res.status(409).json({
        error: 'A venue with this name already exists in this area.',
        existing: reshapeVenue(duplicate),
      });
    }

    const newVenue = await prisma.venue.create({
      data: {
        id: 'v_' + Date.now(),
        slug: generateSlug(v.name),
        name: v.name,
        area: v.area,
        address: v.address,
        category: v.category,
        ramp: v.accessibility.ramp,
        lift: v.accessibility.lift,
        accessibleToilet: v.accessibility.accessibleToilet,
        accessibleParking: v.accessibility.accessibleParking,
        tactilePaving: v.accessibility.tactilePaving,
        wideCorridors: v.accessibility.wideCorridors,
        audioAssistance: v.accessibility.audioAssistance,
        staffAssistance: v.accessibility.staffAssistance,
        lat: v.coordinates.lat,
        lng: v.coordinates.lng,
        addedAt: new Date(),
        isSeeded: false,
      },
    });
    res.status(201).json(reshapeVenue(newVenue));
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error' });
  }
});
// ── Reports ──



// GET /api/reports
// NOTE: not yet in openapi.yaml — used internally by the frontend.
// Documented in CONTRACT_DEVIATIONS.md as an extra endpoint beyond the contract.
app.get('/api/reports', async (req, res) => {
  const reports = await prisma.report.findMany();
  res.json(reports.map(reshapeReport));
});

// GET /api/venues/:venueId/reports
// NOTE: also not yet in openapi.yaml — same status as above.
app.get('/api/venues/:venueId/reports', async (req, res) => {
  const reports = await prisma.report.findMany({ where: { venueId: req.params.venueId } });
  res.json(reports.map(reshapeReport));
});

// POST /api/reports
// POST /api/reports
app.post('/api/reports', async (req, res) => {
  const r = req.body;

  // ── Validation first ──
  if (!r.venueId || typeof r.venueId !== 'string') {
    return res.status(400).json({ error: 'venueId is required and must be a string' });
  }
  if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) {
    return res.status(400).json({ error: 'rating is required and must be an integer from 1 to 5' });
  }
  if (!r.visitedAt || typeof r.visitedAt !== 'string') {
    return res.status(400).json({ error: 'visitedAt is required and must be a date string' });
  }
  const accError = validateAccessibility(r.accessibility);
  if (accError) return res.status(400).json({ error: accError });

  // ── Check the referenced venue actually exists before writing ──
  const venue = await prisma.venue.findUnique({ where: { id: r.venueId } });
  if (!venue) {
    return res.status(404).json({ error: 'No venue found with the given venueId' });
  }

  // ── Only now do we write ──
  try {
    const newReport = await prisma.report.create({
      data: {
        id: 'r_' + Date.now(),
        venueId: r.venueId,
        rating: r.rating,
        description: r.description,
        visitedAt: r.visitedAt,
        submittedAt: new Date(),
        ramp: r.accessibility.ramp,
        lift: r.accessibility.lift,
        accessibleToilet: r.accessibility.accessibleToilet,
        accessibleParking: r.accessibility.accessibleParking,
        tactilePaving: r.accessibility.tactilePaving,
        wideCorridors: r.accessibility.wideCorridors,
        audioAssistance: r.accessibility.audioAssistance,
        staffAssistance: r.accessibility.staffAssistance,
      },
    });
    res.status(201).json(reshapeReport(newReport));
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

await ensureSeeded();
app.listen(3000, () => console.log('API running on http://localhost:3000'));