import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prisma from './db/database.js';
import authRoutes from './routes/auth.js';
import missionsRoutes from './routes/missions.js';
import levelsRoutes from './routes/levels.js';
import usersRoutes from './routes/users.js';
import mitreRoutes from './routes/mitre.js';
import translationsRoutes from './routes/translations.js';
import adminRoutes from './routes/admin.js';
import supportRoutes from './routes/support.js';
import notificationsRoutes from './routes/notifications.js';
import newsRoutes from './routes/news.js';
import { apiErrorHandler, apiNotFoundHandler } from './middleware/errorHandler.js';
import { ensureAvatarsDir } from './services/avatarService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.disable('x-powered-by');

// Middleware
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
  })
);
app.use(
  helmet({
    hidePoweredBy: true,
    // API JSON responses; allow avatar images from /uploads on another origin (dev client).
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/news', newsRoutes);

app.use(apiNotFoundHandler);
app.use(apiErrorHandler);

// Start server
app.listen(PORT, async () => {
  // Test database connection
  try {
    await prisma.$connect();
    await ensureAvatarsDir();
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
