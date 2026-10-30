import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import venueRoutes from './routes/venues.js';
import reportRoutes from './routes/reports.js';
import partnerRoutes from './routes/partner.js';
import { checkApiKey, isPublicReadRequest } from './middleware.js';
import { rateLimiter } from './ratelimiter.js';

dotenv.config();

const app = express();
export const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.disable('x-powered-by');

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

// The health check and explicitly allowlisted read-only routes are public.
app.get('/', (req, res) => {
  res.send('AccessMap API is running');
});

const apiKeyRateLimiter = rateLimiter({ windowMs: 60_000, max: 100 });
const publicReadRateLimiter = rateLimiter({ windowMs: 60_000, max: 100 });

app.use('/api', (req, res, next) => {
  if (isPublicReadRequest(req)) {
    return publicReadRateLimiter(req, res, next);
  }

  return checkApiKey(req, res, () =>
    apiKeyRateLimiter(req, res, next)
  );
});

// Mount modular routes (Lab Step 4)
app.use('/api/venues', venueRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/partner', partnerRoutes);

export default app ;
