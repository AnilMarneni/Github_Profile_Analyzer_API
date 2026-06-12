const githubService = require('../services/githubService');
const { AppError } = require('../middlewares/errorHandler');
const db = require('../config/db');

// Validates GitHub username using official format rules
const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username);
};

const analyzeProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!isValidUsername(username)) {
      throw new AppError('Invalid GitHub username', 400);
    }

    const result = await githubService.analyzeAndSaveProfile(username);
    res.status(200).json({
      success: true,
      message: 'Profile analyzed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const refreshProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!isValidUsername(username)) {
      throw new AppError('Invalid GitHub username', 400);
    }

    const result = await githubService.refreshProfile(username);
    res.status(200).json({
      success: true,
      message: 'Profile refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

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

const searchProfiles = async (req, res, next) => {
  try {
    const { q, query, page = 1, limit = 10 } = req.query;
    const searchVal = q || query;
    if (!searchVal || !searchVal.trim()) {
      throw new AppError('Query parameter "q" or "query" is required', 400);
    }

    const result = await githubService.searchProfiles({ q: searchVal.trim(), page, limit });
    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getSingleProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!isValidUsername(username)) {
      throw new AppError('Invalid GitHub username', 400);
    }

    const result = await githubService.getSingleProfile(username);
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!isValidUsername(username)) {
      throw new AppError('Invalid GitHub username', 400);
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

const getStats = async (req, res, next) => {
  try {
    const result = await githubService.getStats();
    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getHealth = async (req, res, next) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: { status: 'ok', database: 'connected' }
    });
  } catch (error) {
    console.error('Health check failure:', error.message);
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
