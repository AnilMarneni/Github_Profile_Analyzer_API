# 📊 GitHub Profile Analyzer API

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://www.postman.com/)

> **Node.js Intern Assignment Submission**  
> A backend assignment built using Node.js, Express.js, MySQL, and the GitHub REST API to fetch, analyze, and store developer profiles and repository statistics.

---

## 🚀 Features

* **Profile Analysis (POST)**: Fetches profile data and repositories directly from the GitHub API. If a profile is already in the database, it updates the record.
* **Developer Metrics**:
  * **Developer Score**: `followers + total_stars + (public_repos * 2)`.
  * **Profile Health**: Classified as `Beginner` (score < 100), `Growing` (100 - 499), `Good` (500 - 1499), or `Excellent` (>= 1500).
  * **Average Stars Per Repo**: Calculated locally.
  * **Recent Repository Activity**: Counts public repositories created within the last 12 months.
  * **Repository-to-Follower Ratio**: Handles division-by-zero safely.
* **Top 5 Repositories**: Stores top 5 projects ranked by star counts in a separate table.
* **Pagination & Sorting (GET)**: Fetches all stored profiles with support for paging and sorting by followers, developer score, or analysis time.
* **Keyword Search (GET)**: Searches stored profiles by username or name.
* **Statistics & Aggregations (GET)**: Computes total analyzed profiles, average followers, average stars, maximum developer score, and most common language.
* **Health Check & Swagger Documentation**: Dynamic API documentation served at `/api-docs`.

---

## 📐 Architecture & Flow

The project follows a standard Controller-Service-Repository structure:

```
          ┌───────────────────────────┐
          │   HTTP Requests (Client)  │
          └─────────────┬─────────────┘
                        │
                        ▼
          ┌───────────────────────────┐
          │     Express (app.js)      │
          └─────────────┬─────────────┘
                        │
                        ▼
          ┌───────────────────────────┐
          │  Routes (githubRoutes.js) │
          └─────────────┬─────────────┘
                        │
                        ▼
          ┌───────────────────────────┐
          │Controllers (controller.js)│
          └─────────────┬─────────────┘
                        │
                        ▼
          ┌───────────────────────────┐
          │  Services (githubService) │
          └──────┬─────────────┬──────┘
                 │             │
        ┌────────▼────────┐    └────────▼────────┐
        │ GitHub REST API │    │ MySQL Connection│
        │  (Axios Calls)  │    │  Pool (db.js)   │
        └─────────────────┘    └─────────────────┘
```

* **App Entry (`src/app.js`)**: Starts the server, loads environment variables, and registers middlewares and routes.
* **Routes (`src/routes/githubRoutes.js`)**: Defines endpoint URLs.
* **Controllers (`src/controllers/githubController.js`)**: Validates input usernames and handles HTTP requests.
* **Services (`src/services/githubService.js`)**: Deals with GitHub API requests, connection queries, and database transaction controls.
* **Utilities (`src/utils/analytics.js`)**: Helper functions for analytics and calculations.
* **Middlewares (`src/middlewares/errorHandler.js`)**: Standardizes global exceptions into uniform JSON structures.

---

## 🗄 Database Schema

The database contains two tables with a **one-to-many (1:N)** relationship and cascade delete constraints.

```
┌──────────────────────────────────────┐          ┌─────────────────────────┐
│           github_profiles            │          │    top_repositories     │
├──────────────────────────────────────┤          ├─────────────────────────┤
│ id (PK)                              │ 1      N │ id (PK)                 │
│ username (UNIQUE INDEX)              ├─────────►│ profile_id (FK, INDEX)  │
│ name                                 │          │ repo_name               │
│ bio                                  │          │ stars                   │
│ avatar_url                           │          │ forks                   │
│ github_url                           │          │ language                │
│ followers (INDEX)                    │          │ repo_url                │
│ following                            │          └─────────────────────────┘
│ public_repos                         │
│ total_stars                          │
│ total_forks                          │
│ total_watchers                       │
│ most_used_language                   │
│ developer_score (INDEX)              │
│ profile_health                       │
│ avg_stars_per_repo                   │
│ recent_repos_created                 │
│ account_age_years                    │
│ repo_follower_ratio                  │
│ github_created_at                    │
│ analyzed_at                          │
└──────────────────────────────────────┘
```

* **Table `github_profiles`**: Stores developer metrics. Indexes are configured on `username`, `developer_score`, and `followers` for sorting performance.
* **Table `top_repositories`**: Tracks the user's top 5 starred repositories. Linked via `profile_id` referencing `github_profiles(id) ON DELETE CASCADE`.

---

## ⚙️ Setup Instructions

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16.0 or higher)
* [MySQL Server](https://www.mysql.com/) (v8.0 or higher)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file at the root based on `.env.example`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer

# Optional: Personal Access Token to avoid GitHub API rate limiting
GITHUB_TOKEN=
```

### 4. Database Setup
Create database and load schema:
```bash
mysql -u root -p -e "CREATE DATABASE github_analyzer;"
mysql -u root -p github_analyzer < database/schema.sql
```

---

## 🚀 Running the Project

* **Development (Hot-Reload)**: `npm run dev`
* **Production**: `npm start`

---

## 📘 API Routes Reference

All responses return standard structures:
* **Success**: `{ "success": true, "message": "...", "data": {} }`
* **Error**: `{ "success": false, "message": "..." }`

### Endpoints
* `GET /api/health` - Health check.
* `GET /api/stats` - Aggregate statistics for analyzed profiles.
* `POST /api/profile/:username` - Analyzes a profile and saves/updates it.
* `PUT /api/profile/:username/refresh` - Refreshes a profile.
* `GET /api/profiles` - Lists profiles. Supports `page`, `limit`, and `sort` query params.
* `GET /api/profiles/search?q=keyword` - Searches profiles by username or name.
* `GET /api/profiles/:username` - Gets details for an analyzed profile.
* `DELETE /api/profiles/:username` - Deletes a profile.

---

## 📊 Sample Response (`POST /api/profile/octocat`)
```json
{
  "success": true,
  "message": "Profile analyzed successfully",
  "data": {
    "profile": {
      "id": 1,
      "username": "octocat",
      "name": "The Octocat",
      "bio": "Testing things",
      "avatar_url": "https://avatars.githubusercontent.com/u/5832347?v=4",
      "github_url": "https://github.com/octocat",
      "followers": 9840,
      "following": 9,
      "public_repos": 8,
      "total_stars": 154,
      "total_forks": 32,
      "total_watchers": 154,
      "most_used_language": "Ruby",
      "developer_score": 9866,
      "profile_health": "Excellent",
      "avg_stars_per_repo": 19.25,
      "recent_repos_created": 1,
      "account_age_years": 15.38,
      "repo_follower_ratio": 0.0008,
      "github_created_at": "2011-01-25T18:44:36.000Z",
      "analyzed_at": "2026-06-11T12:00:00.000Z"
    },
    "top_repositories": [
      {
        "repo_name": "git-consortium",
        "stars": 64,
        "forks": 18,
        "language": "Ruby",
        "repo_url": "https://github.com/octocat/git-consortium"
      }
    ]
  }
}
```

---

## ☁️ Deployment Guidelines

1. **Database**: Spin up a MySQL instance on Railway or Render, and run `schema.sql` to initialize tables.
2. **Web Service**: Host this Node.js repository on your platform. Set your build command to `npm install` and start command to `npm start`.
3. **Environment Configuration**: Set host variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, and optional `GITHUB_TOKEN`) in the settings dashboard.
