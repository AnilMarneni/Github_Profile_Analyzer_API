-- Create database if not exists (helpful for setup guidelines, though actual database creation is done by admin)
-- CREATE DATABASE IF NOT EXISTS github_analyzer;
-- USE github_analyzer;

-- Drop tables if they exist to allow clean re-runs of the schema script
DROP TABLE IF EXISTS top_repositories;
DROP TABLE IF EXISTS github_profiles;

-- Create github_profiles table
CREATE TABLE github_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(2083),
    github_url VARCHAR(2083),
    followers INT DEFAULT 0,
    following INT DEFAULT 0,
    public_repos INT DEFAULT 0,
    total_stars INT DEFAULT 0,
    total_forks INT DEFAULT 0,
    total_watchers INT DEFAULT 0,
    most_used_language VARCHAR(100),
    developer_score INT DEFAULT 0,
    profile_health VARCHAR(50) DEFAULT 'Beginner',
    avg_stars_per_repo DECIMAL(10,2) DEFAULT 0.00,
    recent_repos_created INT DEFAULT 0,
    account_age_years DECIMAL(5,2) DEFAULT 0.00,
    repo_follower_ratio DECIMAL(10,4) DEFAULT 0.0000,
    github_created_at DATETIME NOT NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_username (username),
    INDEX idx_developer_score (developer_score),
    INDEX idx_followers (followers)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create top_repositories table
CREATE TABLE top_repositories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    stars INT DEFAULT 0,
    forks INT DEFAULT 0,
    language VARCHAR(100),
    repo_url VARCHAR(2083) NOT NULL,
    CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES github_profiles (id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;