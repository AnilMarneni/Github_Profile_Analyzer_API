/**
 * Analytics Utility Module
 * Contains helper functions to parse and analyze GitHub profile and repository data.
 */

/**
 * Calculates the total stars across all repositories.
 * @param {Array} repos 
 * @returns {number}
 */
const calculateTotalStars = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
};

/**
 * Calculates the total forks across all repositories.
 * @param {Array} repos 
 * @returns {number}
 */
const calculateTotalForks = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
};

/**
 * Calculates the total watchers across all repositories.
 * @param {Array} repos 
 * @returns {number}
 */
const calculateTotalWatchers = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.watchers_count || 0), 0);
};

/**
 * Determines the most frequently used language in the repositories.
 * @param {Array} repos 
 * @returns {string|null}
 */
const determineMostUsedLanguage = (repos) => {
  const languageCounts = {};
  let maxCount = 0;
  let mostUsed = null;

  for (const repo of repos) {
    const lang = repo.language;
    if (lang && typeof lang === 'string') {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      if (languageCounts[lang] > maxCount) {
        maxCount = languageCounts[lang];
        mostUsed = lang;
      }
    }
  }

  return mostUsed;
};

/**
 * Calculates the account age in years.
 * @param {string} createdAtIsoString 
 * @returns {number}
 */
const calculateAccountAge = (createdAtIsoString) => {
  const createdDate = new Date(createdAtIsoString);
  const currentDate = new Date();
  const diffTime = Math.max(0, currentDate - createdDate);
  // Calculate fractional years
  const ageYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return parseFloat(ageYears.toFixed(2));
};

/**
 * Calculates public repositories to followers ratio.
 * @param {number} publicRepos 
 * @param {number} followers 
 * @returns {number}
 */
const calculateRepoFollowerRatio = (publicRepos, followers) => {
  if (!followers || followers === 0) {
    return 0.0000;
  }
  const ratio = publicRepos / followers;
  return parseFloat(ratio.toFixed(4));
};

/**
 * Calculates the Developer Score.
 * Formula: followers + totalStars + (publicRepos * 2)
 * @param {number} followers 
 * @param {number} totalStars 
 * @param {number} publicRepos 
 * @returns {number}
 */
const calculateDeveloperScore = (followers, totalStars, publicRepos) => {
  return (followers || 0) + (totalStars || 0) + ((publicRepos || 0) * 2);
};

/**
 * Classifies profile health based on developer score.
 * Thresholds:
 * - Beginner: score < 100
 * - Growing: 100 - 499
 * - Good: 500 - 1499
 * - Excellent: >= 1500
 * @param {number} developerScore 
 * @returns {string}
 */
const classifyProfileHealth = (developerScore) => {
  if (developerScore < 100) return 'Beginner';
  if (developerScore < 500) return 'Growing';
  if (developerScore < 1500) return 'Good';
  return 'Excellent';
};

/**
 * Calculates average stars per repository.
 * @param {number} totalStars 
 * @param {number} publicRepos 
 * @returns {number}
 */
const calculateAvgStarsPerRepo = (totalStars, publicRepos) => {
  if (!publicRepos || publicRepos === 0) {
    return 0.00;
  }
  const avg = totalStars / publicRepos;
  return parseFloat(avg.toFixed(2));
};

/**
 * Counts repositories created in the last 12 months.
 * @param {Array} repos 
 * @returns {number}
 */
const countRecentReposCreated = (repos) => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  return repos.filter(repo => {
    if (!repo.created_at) return false;
    const repoCreatedAt = new Date(repo.created_at);
    return repoCreatedAt >= oneYearAgo;
  }).length;
};

/**
 * Gets top 5 repositories by star count.
 * @param {Array} repos 
 * @returns {Array}
 */
const getTopRepositories = (repos) => {
  return [...repos]
    .sort((a, b) => {
      const starDiff = (b.stargazers_count || 0) - (a.stargazers_count || 0);
      if (starDiff !== 0) return starDiff;
      // Secondary sort by forks
      return (b.forks_count || 0) - (a.forks_count || 0);
    })
    .slice(0, 5)
    .map(repo => ({
      repo_name: repo.name,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || null,
      repo_url: repo.html_url
    }));
};

/**
 * Aggregates all repository-level analytics.
 * @param {Object} profile - Raw GitHub user profile object
 * @param {Array} repos - Raw GitHub user repositories array
 * @returns {Object} Calculated analytics results
 */
const analyzeGitHubData = (profile, repos) => {
  const totalStars = calculateTotalStars(repos);
  const totalForks = calculateTotalForks(repos);
  const totalWatchers = calculateTotalWatchers(repos);
  const mostUsedLanguage = determineMostUsedLanguage(repos);
  
  const publicRepos = profile.public_repos || 0;
  const followers = profile.followers || 0;
  
  const developerScore = calculateDeveloperScore(followers, totalStars, publicRepos);
  const profileHealth = classifyProfileHealth(developerScore);
  const avgStarsPerRepo = calculateAvgStarsPerRepo(totalStars, publicRepos);
  const recentReposCreated = countRecentReposCreated(repos);
  
  const accountAgeYears = calculateAccountAge(profile.created_at);
  const repoFollowerRatio = calculateRepoFollowerRatio(publicRepos, followers);
  
  const topRepositories = getTopRepositories(repos);

  return {
    profileData: {
      username: profile.login,
      name: profile.name || null,
      bio: profile.bio || null,
      avatar_url: profile.avatar_url,
      github_url: profile.html_url,
      followers,
      following: profile.following || 0,
      public_repos: publicRepos,
      total_stars: totalStars,
      total_forks: totalForks,
      total_watchers: totalWatchers,
      most_used_language: mostUsedLanguage,
      developer_score: developerScore,
      profile_health: profileHealth,
      avg_stars_per_repo: avgStarsPerRepo,
      recent_repos_created: recentReposCreated,
      account_age_years: accountAgeYears,
      repo_follower_ratio: repoFollowerRatio,
      github_created_at: new Date(profile.created_at) // Convert ISO string to Date object
    },
    topRepositories
  };
};

module.exports = {
  calculateTotalStars,
  calculateTotalForks,
  calculateTotalWatchers,
  determineMostUsedLanguage,
  calculateAccountAge,
  calculateRepoFollowerRatio,
  calculateDeveloperScore,
  classifyProfileHealth,
  calculateAvgStarsPerRepo,
  countRecentReposCreated,
  getTopRepositories,
  analyzeGitHubData
};
