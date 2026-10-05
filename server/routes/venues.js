import express from 'express';
import pool from '../db.js';

const router = express.Router();

// ── Contract Reshaping Helpers (Lab 5) ──
// Transforms flat SQL columns into the exact OpenAPI Venue schema
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
    coordinates: v.lat !== null && v.lng !== null ? {
      lat: Number(v.lat),
      lng: Number(v.lng)
    } : undefined,
    addedAt: v.addedAt,
  };
}

function reshapeReport(r) {
  return {
    id: r.id,
    venueId: r.venueId,
    rating: r.rating,
    description: r.description || undefined,
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

// ── Input Validation Helpers (Lab 6) ──
function validateAccessibility(acc) {
  const keys = ['ramp', 'lift', 'accessibleToilet', 'accessibleParking',
                'tactilePaving', 'wideCorridors', 'audioAssistance', 'staffAssistance'];
  if (!acc || typeof acc !== 'object') return 'accessibility object is required';
  for (const key of keys) {
    if (typeof acc[key] !== 'boolean') return `accessibility.${key} must be a boolean`;
  }
  return null;
}

// GET /api/venues - Get venues with optional query filters
router.get('/', async (req, res) => {
  try {
    const { category, area, accessible } = req.query;

    let query = 'SELECT * FROM "Venue"';
    const conditions = [];
    const values = [];

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }
    if (area) {
      values.push(area);
      conditions.push(`area = $${values.length}`);
    }
    if (accessible === 'true') {
      conditions.push(`ramp = true AND "accessibleToilet" = true AND "accessibleParking" = true`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const { rows } = await pool.query(query, values);
    res.status(200).json(rows.map(reshapeVenue));
  } catch (err) {
    console.error('Error fetching venues:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

// GET /api/venues/:slug - Get single venue details
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { rows } = await pool.query('SELECT * FROM "Venue" WHERE slug = $1', [slug]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No venue found with the given slug' });
    }

    res.status(200).json(reshapeVenue(rows[0]));
  } catch (err) {
    console.error('Error fetching venue:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

// GET /api/venues/:slug/rating - Get average star rating for a venue
router.get('/:slug/rating', async (req, res) => {
  try {
    const { slug } = req.params;
    const venueResult = await pool.query('SELECT id, slug FROM "Venue" WHERE slug = $1', [slug]);

    if (venueResult.rows.length === 0) {
      return res.status(404).json({ error: 'No venue found with the given slug' });
    }

    const venue = venueResult.rows[0];
    const reportsResult = await pool.query('SELECT rating FROM "Report" WHERE "venueId" = $1', [venue.id]);
    
    const reports = reportsResult.rows;
    const totalReports = reports.length;
    const averageRating = totalReports === 0
      ? 0
      : Math.round((reports.reduce((sum, r) => sum + r.rating, 0) / totalReports) * 10) / 10;

    res.status(200).json({
      slug: venue.slug,
      averageRating,
      totalReports,
    });
  } catch (err) {
    console.error('Error calculating rating:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

// GET /api/venues/:venueId/reports - Aux endpoint used by frontend UI
router.get('/:venueId/reports', async (req, res) => {
  try {
    const { venueId } = req.params;
    const { rows } = await pool.query('SELECT * FROM "Report" WHERE "venueId" = $1', [venueId]);
    res.status(200).json(rows.map(reshapeReport));
  } catch (err) {
    console.error('Error fetching venue reports:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

// POST /api/venues - Add a new venue
router.post('/', async (req, res) => {
  const v = req.body;

  // ── Step 1: Validation First (Lab 6) ──
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

  const lat = v.coordinates?.lat ?? null;
  const lng = v.coordinates?.lng ?? null;

  // ── Step 2: DB Writes ──
  try {
    // Check duplicate venue
    const dupCheck = await pool.query(
      'SELECT * FROM "Venue" WHERE name = $1 AND area = $2',
      [v.name, v.area]
    );

    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'A venue with this name already exists in this area.',
        existing: reshapeVenue(dupCheck.rows[0]),
      });
    }
    const maxIdResult = await pool.query(`
      SELECT MAX(CAST(SUBSTRING(id FROM 3) AS INTEGER)) AS max_num 
      FROM "Venue"
      `);
    
       const nextNum = (maxIdResult.rows[0].max_num || 0) + 1;
     const id = `v_${String(nextNum).padStart(3, "0")}`;
     const slug=generateSlug(v.name)
     const insertQuery = `
      INSERT INTO "Venue" (
        id, slug, name, area, address, category,
        ramp, lift, "accessibleToilet", "accessibleParking",
        "tactilePaving", "wideCorridors", "audioAssistance", "staffAssistance",
        lat, lng, "addedAt", "isSeeded"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *;
    `;

    const values = [
      id, slug, v.name, v.area, v.address, v.category,
      v.accessibility.ramp, v.accessibility.lift, v.accessibility.accessibleToilet,
      v.accessibility.accessibleParking, v.accessibility.tactilePaving,
      v.accessibility.wideCorridors, v.accessibility.audioAssistance, v.accessibility.staffAssistance,
      lat, lng, new Date().toISOString(), false
    ];

    const { rows } = await pool.query(insertQuery, values);
    res.status(201).json(reshapeVenue(rows[0]));
  } catch (err) {
    console.error('Error creating venue:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

export default router;