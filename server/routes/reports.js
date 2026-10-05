import express from 'express';
import pool from '../db.js';


const router = express.Router();

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

function validateAccessibility(acc) {
  const keys = ['ramp', 'lift', 'accessibleToilet', 'accessibleParking',
                'tactilePaving', 'wideCorridors', 'audioAssistance', 'staffAssistance'];
  if (!acc || typeof acc !== 'object') return 'accessibility object is required';
  for (const key of keys) {
    if (typeof acc[key] !== 'boolean') return `accessibility.${key} must be a boolean`;
  }
  return null;
}

// GET /api/reports - Aux endpoint used by frontend UI
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM "Report"');
    res.status(200).json(rows.map(reshapeReport));
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

// POST /api/reports - Submit community report
router.post('/', async (req, res) => {
  const r = req.body;

  // ── Step 1: Validation First (Lab 6) ──
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

  // ── Step 2: Check target venue exists before writing (Lab 6) ──
  try {
    const venueCheck = await pool.query('SELECT id FROM "Venue" WHERE id = $1', [r.venueId]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'No venue found with the given venueId' });
    }
   // Extract the highest numeric suffix (after 'r_') from existing reports
   const maxIdResult = await pool.query(`
  SELECT MAX(CAST(SUBSTRING(id FROM 3) AS INTEGER)) AS max_num 
  FROM "Report"
  `);

   const nextNum = (maxIdResult.rows[0].max_num || 0) + 1;
   const id = `r_${String(nextNum).padStart(3, "0")}`;
   const slug =generateSlug(v.name);
    const insertQuery = `
      INSERT INTO "Report" (
        id, "venueId", rating, description, "visitedAt", "submittedAt",
        ramp, lift, "accessibleToilet", "accessibleParking",
        "tactilePaving", "wideCorridors", "audioAssistance", "staffAssistance"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      id, r.venueId, r.rating, r.description || null, r.visitedAt, new Date().toISOString(),
      r.accessibility.ramp, r.accessibility.lift, r.accessibility.accessibleToilet,
      r.accessibility.accessibleParking, r.accessibility.tactilePaving,
      r.accessibility.wideCorridors, r.accessibility.audioAssistance, r.accessibility.staffAssistance
    ];

    const { rows } = await pool.query(insertQuery, values);
    res.status(201).json(reshapeReport(rows[0]));
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

export default router;