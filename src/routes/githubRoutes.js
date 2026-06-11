const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

// 1. Health check endpoint (GET /api/health)
router.get('/health', githubController.getHealth);

// 2. Aggregate statistics endpoint (GET /api/stats)
router.get('/stats', githubController.getStats);

// 3. Profiles search endpoint (GET /api/profiles/search)
// NOTE: MUST be defined BEFORE /api/profiles/:username to prevent collision
router.get('/profiles/search', githubController.searchProfiles);

// 4. Get all profiles endpoint (GET /api/profiles)
router.get('/profiles', githubController.getAllProfiles);

// 5. Get single profile endpoint (GET /api/profiles/:username)
router.get('/profiles/:username', githubController.getSingleProfile);

// 6. Delete profile endpoint (DELETE /api/profiles/:username)
router.get('/profiles/:username', githubController.deleteProfile);

// 7. Analyze profile endpoint (POST /api/profile/:username)
router.post('/profile/:username', githubController.analyzeProfile);

// 8. Refresh profile endpoint (PUT /api/profile/:username/refresh)
router.put('/profile/:username/refresh', githubController.refreshProfile);

module.exports = router;
