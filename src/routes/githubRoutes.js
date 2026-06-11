const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

router.get('/health', githubController.getHealth);
router.get('/stats', githubController.getStats);

// Placed before the wildcard :username path to avoid route collision
router.get('/profiles/search', githubController.searchProfiles);
router.get('/profiles', githubController.getAllProfiles);

router.get('/profiles/:username', githubController.getSingleProfile);
router.delete('/profiles/:username', githubController.deleteProfile);

router.post('/profile/:username', githubController.analyzeProfile);
router.put('/profile/:username/refresh', githubController.refreshProfile);

module.exports = router;
