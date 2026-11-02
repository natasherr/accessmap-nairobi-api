import express from 'express';

const app = express();
const port = Number(process.env.FLAKY_PARTNER_PORT || 4000);
const validModes = new Set(['ok', 'slow', 'flaky', 'error']);
let mode = 'ok';
let calls = 0;

const rallies = [
  {
    id: 'demo-rally-1',
    title: 'Community meeting',
    venue_name: 'Westgate Shopping Mall',
    date: '2026-11-20',
    start_time: '10:00',
    end_time: '12:00',
  },
];

app.get('/__mode/:mode', (req, res) => {
  if (!validModes.has(req.params.mode)) {
    return res.status(400).json({ error: 'Mode must be ok, slow, flaky, or error' });
  }

  mode = req.params.mode;
  calls = 0;
  return res.json({ mode });
});

app.get('/rallies', async (req, res) => {
  calls += 1;
  console.log(`GET /rallies (call ${calls}, mode ${mode})`);

  if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 10_000));
  if (mode === 'flaky' && calls % 3 !== 0) {
    return res.status(503).json({ message: 'Try again' });
  }
  if (mode === 'error') {
    return res.status(500).json({ message: 'Internal error' });
  }

  return res.json(rallies);
});

app.listen(port, () => {
  console.log(`Flaky partner listening at http://localhost:${port}`);
});
