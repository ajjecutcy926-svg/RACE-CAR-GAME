import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  carName: string;
  score: number;
  distance: number; // in meters
  topSpeed: number; // in km/h
  timestamp: number;
  country: string;
}

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Initial seed records representing top global drivers
const SEED_RECORDS: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'PHANTOM_ACE',
    carName: 'Hyperion RS',
    score: 184500,
    distance: 14200,
    topSpeed: 332,
    timestamp: Date.now() - 3600000 * 2,
    country: 'JP',
  },
  {
    id: 'seed-2',
    playerName: 'MIDNIGHT_VIPER',
    carName: 'Cyber Horizon',
    score: 152800,
    distance: 12100,
    topSpeed: 298,
    timestamp: Date.now() - 3600000 * 6,
    country: 'US',
  },
  {
    id: 'seed-3',
    playerName: 'TURBO_VALKYRIE',
    carName: 'Apex GT',
    score: 126400,
    distance: 10450,
    topSpeed: 268,
    timestamp: Date.now() - 3600000 * 12,
    country: 'DE',
  },
  {
    id: 'seed-4',
    playerName: 'V8_THUNDER',
    carName: 'Phantom V8',
    score: 114200,
    distance: 9800,
    topSpeed: 274,
    timestamp: Date.now() - 3600000 * 18,
    country: 'AU',
  },
  {
    id: 'seed-5',
    playerName: 'NEON_RUNNER',
    carName: 'Cyber Horizon',
    score: 98600,
    distance: 8250,
    topSpeed: 265,
    timestamp: Date.now() - 3600000 * 24,
    country: 'GB',
  },
  {
    id: 'seed-6',
    playerName: 'DRIFT_GHOST',
    carName: 'Apex GT',
    score: 87400,
    distance: 7400,
    topSpeed: 252,
    timestamp: Date.now() - 3600000 * 30,
    country: 'FR',
  },
  {
    id: 'seed-7',
    playerName: 'HIGHWAY_HAWK',
    carName: 'Phantom V8',
    score: 76200,
    distance: 6900,
    topSpeed: 248,
    timestamp: Date.now() - 3600000 * 36,
    country: 'CA',
  },
  {
    id: 'seed-8',
    playerName: 'REDLINE_KID',
    carName: 'Apex GT',
    score: 62500,
    distance: 5800,
    topSpeed: 242,
    timestamp: Date.now() - 3600000 * 42,
    country: 'BR',
  },
];

let leaderboard: LeaderboardEntry[] = [];

// Initialize data persistence
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    leaderboard = JSON.parse(raw);
  } else {
    leaderboard = [...SEED_RECORDS];
    fs.writeFileSync(DATA_FILE, JSON.stringify(leaderboard, null, 2));
  }
} catch (err) {
  console.warn('Failed to load leaderboard file, using in-memory store:', err);
  leaderboard = [...SEED_RECORDS];
}

function persistData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(leaderboard, null, 2));
  } catch (err) {
    console.error('Error saving leaderboard:', err);
  }
}

// Country flags pool for realistic global feel
const COUNTRIES = ['US', 'JP', 'DE', 'GB', 'FR', 'CA', 'AU', 'BR', 'KR', 'IT', 'ES', 'NL'];

// 1. GET /api/leaderboard
app.get('/api/leaderboard', (req, res) => {
  const sortBy = (req.query.sortBy as string) || 'score';
  const limit = Math.min(100, Math.max(5, parseInt(req.query.limit as string) || 50));

  const sorted = [...leaderboard].sort((a, b) => {
    if (sortBy === 'distance') {
      return b.distance - a.distance;
    }
    if (sortBy === 'speed') {
      return b.topSpeed - a.topSpeed;
    }
    // Default: score
    return b.score - a.score;
  });

  res.json({
    success: true,
    sortBy,
    totalRecords: leaderboard.length,
    records: sorted.slice(0, limit),
  });
});

// 2. POST /api/leaderboard
app.post('/api/leaderboard', (req, res) => {
  const { playerName, carName, score, distance, topSpeed } = req.body;

  if (typeof score !== 'number' || typeof distance !== 'number' || typeof topSpeed !== 'number') {
    res.status(400).json({ success: false, error: 'Invalid numeric fields' });
    return;
  }

  const sanitizedName = String(playerName || 'ANON_DRIVER')
    .trim()
    .slice(0, 16)
    .toUpperCase()
    .replace(/[^A-Z0-9_\-\s]/g, '') || 'ANON_DRIVER';

  const sanitizedCar = String(carName || 'Apex GT').slice(0, 32);

  const newEntry: LeaderboardEntry = {
    id: 'entry-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    playerName: sanitizedName,
    carName: sanitizedCar,
    score: Math.max(0, Math.floor(score)),
    distance: Math.max(0, Math.floor(distance)),
    topSpeed: Math.max(0, Math.floor(topSpeed)),
    timestamp: Date.now(),
    country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
  };

  leaderboard.push(newEntry);
  persistData();

  // Compute player's ranks
  const scoreSorted = [...leaderboard].sort((a, b) => b.score - a.score);
  const distSorted = [...leaderboard].sort((a, b) => b.distance - a.distance);
  const speedSorted = [...leaderboard].sort((a, b) => b.topSpeed - a.topSpeed);

  const scoreRank = scoreSorted.findIndex((r) => r.id === newEntry.id) + 1;
  const distanceRank = distSorted.findIndex((r) => r.id === newEntry.id) + 1;
  const speedRank = speedSorted.findIndex((r) => r.id === newEntry.id) + 1;

  res.json({
    success: true,
    record: newEntry,
    ranks: {
      scoreRank,
      distanceRank,
      speedRank,
      totalPlayers: leaderboard.length,
    },
  });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT} [${isDev ? 'development' : 'production'}]`);
  });
}

startServer();
