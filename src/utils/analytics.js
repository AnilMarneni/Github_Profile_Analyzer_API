// Analytics helper functions to calculate profile and repository statistics.

const calculateTotalStars = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
};

const calculateTotalForks = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
};

const calculateTotalWatchers = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.watchers_count || 0), 0);
};

// Count frequencies to determine the most used language
const determineMostUsedLanguage = (repos) => {
  const counts = {};
  let max = 0;
  let mostUsed = null;

  for (const repo of repos) {
    const lang = repo.language;
    if (lang && typeof lang === 'string') {
      counts[lang] = (counts[lang] || 0) + 1;
      if (counts[lang] > max) {
        max = counts[lang];
        mostUsed = lang;
      }
    }
  }
  return mostUsed;
};

// Calculate fractional account age in years
const calculateAccountAge = (createdAtIso) => {
  const ageMs = Math.max(0, new Date() - new Date(createdAtIso));
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  return parseFloat(ageYears.toFixed(2));
};

const calculateRepoFollowerRatio = (publicRepos, followers) => {
  if (!followers) return 0.0000;
  return parseFloat((publicRepos / followers).toFixed(4));
};

// Developer score formula: followers + totalStars + (publicRepos * 2)
const calculateDeveloperScore = (followers, totalStars, publicRepos) => {
  return (followers || 0) + (totalStars || 0) + ((publicRepos || 0) * 2);
};

// Health tiers based on developer score
const classifyProfileHealth = (score) => {
  if (score < 100) return 'Beginner';
  if (score < 500) return 'Growing';
  if (score < 1500) return 'Good';
  return 'Excellent';
};

const calculateAvgStarsPerRepo = (totalStars, publicRepos) => {
  if (!publicRepos) return 0.00;
  return parseFloat((totalStars / publicRepos).toFixed(2));
};

// Count repositories created in the last 12 months
const countRecentReposCreated = (repos) => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return repos.filter(repo => repo.created_at && new Date(repo.created_at) >= oneYearAgo).length;
};

// Get top 5 repositories sorted descending by stars, secondary by forks
const getTopRepositories = (repos) => {
  return [...repos]
    .sort((a, b) => {
      const starDiff = (b.stargazers_count || 0) - (a.stargazers_count || 0);
      if (starDiff !== 0) return starDiff;
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

// Analyze profile and repository payloads to generate aggregate statistics
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
      github_created_at: new Date(profile.created_at)
    },
    topRepositories
  };
};

module.exports = {
  analyzeGitHubData
};
