const githubService = require('../services/githubService');
const { AppError } = require('../middlewares/errorHandler');
const db = require('../config/db');

/**
 * Validates a GitHub username according to official rules:
 * - Alphanumeric characters or single hyphens.
 * - Cannot begin or end with a hyphen.
 * - Max length of 39 characters.
 * @param {string} username 
 * @returns {boolean}
 */
const isValidGithubUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  // Regex matches 1-39 alphanumeric chars or single internal hyphens
  const regex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  return regex.test(username);
};

/**
 * POST /api/profile/:username
 * Analyzes and saves profile (upserts).
 */
const analyzeProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    if (!isValidGithubUsername(username)) {
      throw new AppError('Invalid GitHub username format. Usernames must be 1-39 characters, alphanumeric, and may contain single hyphens (not starting/ending with one).', 400);
    }

    const result = await githubService.analyzeAndSaveProfile(username);

    res.status(200).json({
      success: true,
      message: 'Profile analyzed and saved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/:username/refresh
 * Refreshes existing profile data in the database.
 */
const refreshProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    if (!isValidGithubUsername(username)) {
      throw new AppError('Invalid GitHub username format.', 400);
    }

    const result = await githubService.refreshProfile(username);

    res.status(200).json({
      success: true,
      message: 'Profile analysis refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profiles
 * Lists all analyzed profiles with pagination and sorting.
 */
const getAllProfiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'analyzed_at' } = req.query;

    const result = await githubService.getAllProfiles({ page, limit, sort });

    res.status(200).json({
      success: true,
      message: 'Profiles retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profiles/search
 * Searches profiles by username or name.
 */
const searchProfiles = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
      throw new AppError('Search query parameter "q" is required and cannot be empty.', 400);
    }

    const result = await githubService.searchProfiles({ q: q.trim(), page, limit });

    res.status(200).json({
      success: true,
      message: 'Profiles search completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profiles/:username
 * Retrieves a single profile and its repositories by username.
 */
const getSingleProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    if (!isValidGithubUsername(username)) {
      throw new AppError('Invalid GitHub username format.', 400);
    }

    const result = await githubService.getSingleProfile(username);

    res.status(200).json({
      success: true,
      message: 'Profile details retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/profiles/:username
 * Deletes a profile and associated repositories.
 */
const deleteProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    if (!isValidGithubUsername(username)) {
      throw new AppError('Invalid GitHub username format.', 400);
    }

    await githubService.deleteProfile(username);

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats
 * Gets aggregate statistics for analyzed profiles.
 */
const getStats = async (req, res, next) => {
  try {
    const result = await githubService.getStats();

    res.status(200).json({
      success: true,
      message: 'Aggregate statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/health
 * Health check endpoint. Verifies database connectivity.
 */
const getHealth = async (req, res, next) => {
  try {
    // Verify DB connectivity
    await db.query('SELECT 1');

    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: {
        status: 'ok',
        database: 'connected'
      }
    });
  } catch (error) {
    console.error('Health Check Failed:', error.message);
    res.status(500).json({
      success: false,
      message: `Service is unhealthy: Database connection failed (${error.message})`
    });
  }
};

module.exports = {
  analyzeProfile,
  refreshProfile,
  getAllProfiles,
  searchProfiles,
  getSingleProfile,
  deleteProfile,
  getStats,
  getHealth
};
