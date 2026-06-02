require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const itemRoutes = require('./routes/items');
const categoryRoutes = require('./routes/categories');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'backend' }));

// Central error handler — keeps route handlers clean
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern-items';

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

// Export app for testing (tests connect their own in-memory DB)
module.exports = app;

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}
