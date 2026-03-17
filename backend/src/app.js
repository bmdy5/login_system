const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Backend is running',
      endpoints: {
        health: '/api/health',
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      }
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'ok' });
  });

  app.use('/api/auth', authRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
