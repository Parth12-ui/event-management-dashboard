const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Make io accessible to controllers
app.set('io', io);

// Socket.IO setup
const { initSocket } = require('./utils/socket');
initSocket(io);

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------- Health ---------------
const dbState = () => ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';

// Health check — answers even while the database is down, so Render's
// health check and port detection work and the problem is visible.
app.get('/', (req, res) => {
  res.json({ message: 'Felicity API is running', database: dbState() });
});
app.get('/api/health', (req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', database: dbState() });
});

// Fail fast with a clear 503 instead of hanging when the database is unavailable
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  res.status(503).json({ message: 'Database unavailable. Please try again shortly.' });
});

// --------------- Routes ---------------
const authRoutes = require('./routes/auth.routes');
const participantRoutes = require('./routes/participant.routes');
const organizerRoutes = require('./routes/organizer.routes');
const adminRoutes = require('./routes/admin.routes');
const teamRoutes = require('./routes/team.routes');
const forumRoutes = require('./routes/forum.routes');

const feedbackRoutes = require('./routes/feedback.routes');

app.use('/api/auth', authRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/forum', forumRoutes);

app.use('/api/feedback', feedbackRoutes);


// --------------- Database & Server ---------------
const PORT = process.env.PORT || 3000;

const seedAdmin = require('./utils/seedAdmin');

// Listen first so the service is reachable even if MongoDB is down;
// then keep retrying the database connection in the background.
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

let seeded = false;
mongoose.connection.on('connected', async () => {
  console.log('Connected to MongoDB');
  if (!seeded) {
    seeded = true;
    try { await seedAdmin(); } catch (err) { console.error('Admin seed failed:', err.message); }
  }
});
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));

const connectWithRetry = async (attempt = 1) => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set — API routes will return 503 until it is configured.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    const delay = Math.min(30000, 2000 * attempt);
    console.error(`MongoDB connection failed (attempt ${attempt}): ${err.message}. Retrying in ${delay / 1000}s`);
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
};
connectWithRetry();

module.exports = app;
