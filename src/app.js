const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Configs & Middlewares
const db = require('./config/db'); // Ensures connection log triggers on startup
const { errorHandler } = require('./middlewares/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');

// Routes
const githubRoutes = require('./routes/githubRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Apply Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect root URL to Swagger Documentation for better usability
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Serve Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount REST API routes
app.use('/api', githubRoutes);

// Catch-all route handler for undefined paths (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// Prevent unhandled promise rejections from crashing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Prevent uncaught exceptions from silent failures
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err.message);
  console.error(err.stack);
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`GitHub Profile Analyzer API is running on port ${PORT}`);
  console.log(`Swagger Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`Health Check Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});

module.exports = app;
