const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const emergenciesRoutes = require('./routes/emergencies');
const buildingsRoutes = require('./routes/buildings');
const adminRoutes = require('./routes/admin');
const inviteCodesRoutes = require('./routes/invite-codes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (must come before static file serving)
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/emergencies', emergenciesRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invite-codes', inviteCodesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Serve static files from the parent directory (where HTML files are)
// This must come AFTER API routes
app.use(express.static(path.join(__dirname, '..')));

// Serve index/home page for root route (must come after static files)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'home.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

