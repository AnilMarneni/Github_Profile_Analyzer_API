const axios = require('axios');
const db = require('../config/db');
const { analyzeGitHubData } = require('../utils/analytics');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Helper to build GitHub API request headers.
 */
const getGithubHeaders = () => {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'github-profile-analyzer-api'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

/**
 * Fetch profile and repositories concurrently from GitHub REST API.
 * @param {string} username 
 * @returns {Promise<Object>}
 */
const fetchGitHubDataFromApi = async (username) => {
  const headers = getGithubHeaders();
  
  // Fetch user profile and repositories in parallel
  const [profileRes, reposRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${username}`, { headers }),
    axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, { headers })
  ]);
  
  return {
    profile: profileRes.data,
    repos: reposRes.data
  };
};

/**
 * Analyzes and saves a GitHub profile (upsert).
 * Uses a database transaction to ensure data integrity.
 * @param {string} username 
 * @returns {Promise<Object>} The analyzed and stored profile with top repos
 */
const analyzeAndSaveProfile = async (username) => {
  const { profile, repos } = await fetchGitHubDataFromApi(username);
  
  // Calculate analytics
  const { profileData, topRepositories } = analyzeGitHubData(profile, repos);

  // Get a connection for transaction
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();

    // Check if profile already exists
    const [existing] = await conn.query(
      'SELECT id FROM github_profiles WHERE username = ?',
      [username]
    );

    let profileId;

    if (existing.length > 0) {
      // Update existing profile
      profileId = existing[0].id;
      
      const updateSql = `
        UPDATE github_profiles SET
          name = ?, bio = ?, avatar_url = ?, github_url = ?, followers = ?, following = ?,
          public_repos = ?, total_stars = ?, total_forks = ?, total_watchers = ?,
          most_used_language = ?, developer_score = ?, profile_health = ?,
          avg_stars_per_repo = ?, recent_repos_created = ?, account_age_years = ?,
          repo_follower_ratio = ?, github_created_at = ?
        WHERE id = ?
      `;
      
      await conn.query(updateSql, [
        profileData.name,
        profileData.bio,
        profileData.avatar_url,
        profileData.github_url,
        profileData.followers,
        profileData.following,
        profileData.public_repos,
        profileData.total_stars,
        profileData.total_forks,
        profileData.total_watchers,
        profileData.most_used_language,
        profileData.developer_score,
        profileData.profile_health,
        profileData.avg_stars_per_repo,
        profileData.recent_repos_created,
        profileData.account_age_years,
        profileData.repo_follower_ratio,
        profileData.github_created_at,
        profileId
      ]);

      // Clear existing top repositories
      await conn.query('DELETE FROM top_repositories WHERE profile_id = ?', [profileId]);
    } else {
      // Insert new profile
      const insertSql = `
        INSERT INTO github_profiles (
          username, name, bio, avatar_url, github_url, followers, following, public_repos,
          total_stars, total_forks, total_watchers, most_used_language, developer_score,
          profile_health, avg_stars_per_repo, recent_repos_created, account_age_years,
          repo_follower_ratio, github_created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [insertResult] = await conn.query(insertSql, [
        profileData.username,
        profileData.name,
        profileData.bio,
        profileData.avatar_url,
        profileData.github_url,
        profileData.followers,
        profileData.following,
        profileData.public_repos,
        profileData.total_stars,
        profileData.total_forks,
        profileData.total_watchers,
        profileData.most_used_language,
        profileData.developer_score,
        profileData.profile_health,
        profileData.avg_stars_per_repo,
        profileData.recent_repos_created,
        profileData.account_age_years,
        profileData.repo_follower_ratio,
        profileData.github_created_at
      ]);
      
      profileId = insertResult.insertId;
    }

    // Insert top repositories
    if (topRepositories.length > 0) {
      const repoInsertSql = `
        INSERT INTO top_repositories (profile_id, repo_name, stars, forks, language, repo_url)
        VALUES ?
      `;
      const values = topRepositories.map(repo => [
        profileId,
        repo.repo_name,
        repo.stars,
        repo.forks,
        repo.language,
        repo.repo_url
      ]);
      
      await conn.query(repoInsertSql, [values]);
    }

    await conn.commit();
    
    // Return standard object format
    return {
      profile: {
        id: profileId,
        ...profileData
      },
      top_repositories: topRepositories
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Retrieves all analyzed profiles with pagination and sorting.
 * @param {Object} params - page, limit, sort
 * @returns {Promise<Object>}
 */
const getAllProfiles = async ({ page, limit, sort }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;

  // Validate sort parameters to prevent SQL injection
  const allowedSortFields = ['followers', 'developer_score', 'analyzed_at', 'id'];
  const sortBy = allowedSortFields.includes(sort) ? sort : 'analyzed_at';

  // Retrieve total profile count
  const [[countResult]] = await db.query('SELECT COUNT(*) as total FROM github_profiles');
  const total = countResult.total;

  // Retrieve profiles
  const [profiles] = await db.query(
    `SELECT * FROM github_profiles ORDER BY ${sortBy} DESC LIMIT ? OFFSET ?`,
    [limitNum, offset]
  );

  return {
    profiles,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Retrieves a single profile and its associated top repositories by username.
 * @param {string} username 
 * @returns {Promise<Object>}
 */
const getSingleProfile = async (username) => {
  const [profiles] = await db.query(
    'SELECT * FROM github_profiles WHERE username = ?',
    [username]
  );

  if (profiles.length === 0) {
    throw new AppError('Profile not found in database. Please run analysis first.', 404);
  }

  const profile = profiles[0];

  const [topRepos] = await db.query(
    'SELECT id, repo_name, stars, forks, language, repo_url FROM top_repositories WHERE profile_id = ? ORDER BY stars DESC, forks DESC',
    [profile.id]
  );

  return {
    profile,
    top_repositories: topRepos
  };
};

/**
 * Refreshes an existing analyzed profile by username.
 * @param {string} username 
 * @returns {Promise<Object>}
 */
const refreshProfile = async (username) => {
  // Verify if profile already exists in DB
  const [existing] = await db.query(
    'SELECT id FROM github_profiles WHERE username = ?',
    [username]
  );

  if (existing.length === 0) {
    throw new AppError('Profile not found. Use POST /api/profile/:username to analyze for the first time.', 404);
  }

  // Re-fetch and overwrite
  return await analyzeAndSaveProfile(username);
};

/**
 * Deletes an analyzed profile by username.
 * Uses cascading delete at schema-level, but we wrap in transactions for safety.
 * @param {string} username 
 * @returns {Promise<boolean>}
 */
const deleteProfile = async (username) => {
  const [existing] = await db.query(
    'SELECT id FROM github_profiles WHERE username = ?',
    [username]
  );

  if (existing.length === 0) {
    throw new AppError('Profile not found in database.', 404);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Delete profile (causes top_repositories to delete cascadingly due to foreign key)
    await conn.query('DELETE FROM github_profiles WHERE username = ?', [username]);
    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Search profiles by username or name (case-insensitive LIKE).
 * @param {Object} params - q, page, limit
 * @returns {Promise<Object>}
 */
const searchProfiles = async ({ q, page, limit }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;
  const searchPattern = `%${q}%`;

  // Get total count
  const [[countResult]] = await db.query(
    'SELECT COUNT(*) as total FROM github_profiles WHERE username LIKE ? OR name LIKE ?',
    [searchPattern, searchPattern]
  );
  const total = countResult.total;

  // Get matching profiles
  const [profiles] = await db.query(
    `SELECT * FROM github_profiles 
     WHERE username LIKE ? OR name LIKE ? 
     ORDER BY developer_score DESC 
     LIMIT ? OFFSET ?`,
    [searchPattern, searchPattern, limitNum, offset]
  );

  return {
    profiles,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Gets aggregated statistics for all analyzed profiles.
 * @returns {Promise<Object>}
 */
const getStats = async () => {
  // Total profiles
  const [[totalResult]] = await db.query('SELECT COUNT(*) as total FROM github_profiles');
  const total = totalResult.total || 0;

  if (total === 0) {
    return {
      total_profiles: 0,
      average_followers: 0,
      average_stars: 0,
      top_developer_score: 0,
      most_common_language: null
    };
  }

  // Averages and top developer score
  const [[aggregations]] = await db.query(`
    SELECT 
      ROUND(AVG(followers), 2) as avg_followers,
      ROUND(AVG(total_stars), 2) as avg_stars,
      MAX(developer_score) as max_score
    FROM github_profiles
  `);

  // Most common language
  const [langResult] = await db.query(`
    SELECT most_used_language, COUNT(*) as count 
    FROM github_profiles 
    WHERE most_used_language IS NOT NULL 
    GROUP BY most_used_language 
    ORDER BY count DESC 
    LIMIT 1
  `);

  const mostCommonLanguage = langResult.length > 0 ? langResult[0].most_used_language : null;

  return {
    total_profiles: total,
    average_followers: parseFloat(aggregations.avg_followers) || 0,
    average_stars: parseFloat(aggregations.avg_stars) || 0,
    top_developer_score: aggregations.max_score || 0,
    most_common_language: mostCommonLanguage
  };
};

module.exports = {
  fetchGitHubDataFromApi,
  analyzeAndSaveProfile,
  getAllProfiles,
  getSingleProfile,
  refreshProfile,
  deleteProfile,
  searchProfiles,
  getStats
};
