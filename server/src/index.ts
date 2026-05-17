import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './db/database.js';
import authRoutes from './routes/auth.js';
import missionsRoutes from './routes/missions.js';
import levelsRoutes from './routes/levels.js';
import usersRoutes from './routes/users.js';
import mitreRoutes from './routes/mitre.js';
import translationsRoutes from './routes/translations.js';
import handlersRoutes from './routes/handlers.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CyberTactics API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/levels', levelsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/mitre', mitreRoutes);
app.use('/api/translations', translationsRoutes);
app.use('/api/handlers', handlersRoutes);

// Start server
app.listen(PORT, async () => {
  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
  console.log(`🚀 CyberTactics API server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

