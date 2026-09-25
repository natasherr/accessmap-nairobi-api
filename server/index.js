import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import venueRoutes from './routes/venues.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root healthcheck route (Lab Step 4)
app.get('/', (req, res) => {
  res.send('AccessMap API is running');
});

// Mount modular routes (Lab Step 4)
app.use('/api/venues', venueRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});