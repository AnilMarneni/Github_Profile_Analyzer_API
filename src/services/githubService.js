const axios = require('axios');
const db = require('../config/db');
const { analyzeGitHubData } = require('../utils/analytics');
const { AppError } = require('../middlewares/errorHandler');

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

// Fetch profile and repos from GitHub API concurrently
const fetchGitHubData = async (username) => {
  const headers = getGithubHeaders();
  const [profileRes, reposRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${username}`, { headers }),
    axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, { headers })
  ]);
  return { profile: profileRes.data, repos: reposRes.data };
};

// Insert or update profile analytics in the database
const analyzeAndSaveProfile = async (username) => {
  const { profile, repos } = await fetchGitHubData(username);
  const { profileData, topRepositories } = analyzeGitHubData(profile, repos);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM github_profiles WHERE username = ?', [username]);
    let profileId;

    if (existing.length > 0) {
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
        profileData.name, profileData.bio, profileData.avatar_url, profileData.github_url,
        profileData.followers, profileData.following, profileData.public_repos,
        profileData.total_stars, profileData.total_forks, profileData.total_watchers,
        profileData.most_used_language, profileData.developer_score, profileData.profile_health,
        profileData.avg_stars_per_repo, profileData.recent_repos_created, profileData.account_age_years,
        profileData.repo_follower_ratio, profileData.github_created_at, profileId
      ]);
      await conn.query('DELETE FROM top_repositories WHERE profile_id = ?', [profileId]);
    } else {
      const insertSql = `
        INSERT INTO github_profiles (
          username, name, bio, avatar_url, github_url, followers, following, public_repos,
          total_stars, total_forks, total_watchers, most_used_language, developer_score,
          profile_health, avg_stars_per_repo, recent_repos_created, account_age_years,
          repo_follower_ratio, github_created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [insertResult] = await conn.query(insertSql, [
        profileData.username, profileData.name, profileData.bio, profileData.avatar_url,
        profileData.github_url, profileData.followers, profileData.following, profileData.public_repos,
        profileData.total_stars, profileData.total_forks, profileData.total_watchers,
        profileData.most_used_language, profileData.developer_score, profileData.profile_health,
        profileData.avg_stars_per_repo, profileData.recent_repos_created, profileData.account_age_years,
        profileData.repo_follower_ratio, profileData.github_created_at
      ]);
      profileId = insertResult.insertId;
    }

    if (topRepositories.length > 0) {
      const values = topRepositories.map(r => [profileId, r.repo_name, r.stars, r.forks, r.language, r.repo_url]);
      await conn.query(
        'INSERT INTO top_repositories (profile_id, repo_name, stars, forks, language, repo_url) VALUES ?',
        [values]
      );
    }

    await conn.commit();
    return { profile: { id: profileId, ...profileData }, top_repositories: topRepositories };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getAllProfiles = async ({ page, limit, sort }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;

  const allowedSortFields = ['followers', 'developer_score', 'analyzed_at', 'id'];
  const sortBy = allowedSortFields.includes(sort) ? sort : 'analyzed_at';

  const [[countResult]] = await db.query('SELECT COUNT(*) as total FROM github_profiles');
  const total = countResult.total;

  const [profiles] = await db.query(
    `SELECT * FROM github_profiles ORDER BY ${sortBy} DESC LIMIT ? OFFSET ?`,
    [limitNum, offset]
  );

  return {
    profiles,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  };
};

const getSingleProfile = async (username) => {
  const [profiles] = await db.query('SELECT * FROM github_profiles WHERE username = ?', [username]);
  if (profiles.length === 0) {
    throw new AppError('Profile not found', 404);
  }

  const profile = profiles[0];
  const [topRepos] = await db.query(
    'SELECT id, repo_name, stars, forks, language, repo_url FROM top_repositories WHERE profile_id = ? ORDER BY stars DESC, forks DESC',
    [profile.id]
  );

  return { profile, top_repositories: topRepos };
};

const refreshProfile = async (username) => {
  const [existing] = await db.query('SELECT id FROM github_profiles WHERE username = ?', [username]);
  if (existing.length === 0) {
    throw new AppError('Profile not found', 404);
  }
  return await analyzeAndSaveProfile(username);
};

const deleteProfile = async (username) => {
  const [existing] = await db.query('SELECT id FROM github_profiles WHERE username = ?', [username]);
  if (existing.length === 0) {
    throw new AppError('Profile not found', 404);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
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

const searchProfiles = async ({ q, page, limit }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;
  const searchPattern = `%${q}%`;

  const [[countResult]] = await db.query(
    'SELECT COUNT(*) as total FROM github_profiles WHERE username LIKE ? OR name LIKE ?',
    [searchPattern, searchPattern]
  );
  const total = countResult.total;

  const [profiles] = await db.query(
    `SELECT * FROM github_profiles WHERE username LIKE ? OR name LIKE ? ORDER BY developer_score DESC LIMIT ? OFFSET ?`,
    [searchPattern, searchPattern, limitNum, offset]
  );

  return {
    profiles,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  };
};

const getStats = async () => {
  const [[totalResult]] = await db.query('SELECT COUNT(*) as total FROM github_profiles');
  const total = totalResult.total || 0;

  if (total === 0) {
    return { total_profiles: 0, average_followers: 0, average_stars: 0, top_developer_score: 0, most_common_language: null };
  }

  const [[aggregations]] = await db.query(`
    SELECT ROUND(AVG(followers), 2) as avg_followers, ROUND(AVG(total_stars), 2) as avg_stars, MAX(developer_score) as max_score
    FROM github_profiles
  `);

  const [langResult] = await db.query(`
    SELECT most_used_language, COUNT(*) as count FROM github_profiles 
    WHERE most_used_language IS NOT NULL GROUP BY most_used_language ORDER BY count DESC LIMIT 1
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
  fetchGitHubData,
  analyzeAndSaveProfile,
  getAllProfiles,
  getSingleProfile,
  refreshProfile,
  deleteProfile,
  searchProfiles,
  getStats
};
