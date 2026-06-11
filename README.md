# GitHub Profile Analyzer API

A robust, production-ready backend service that integrates with the GitHub Public REST API to analyze developer profiles and repository data, calculate analytical metrics, and store insights in a MySQL database. Designed as an internship assessment project demonstrating Node.js fundamentals, clean architecture, database optimization, and professional API design.

---

## 🚀 Key Features

* **Complete Profile Analysis & Upsert**: Fetches profile data and repositories from GitHub, computes developer metrics, and stores the results. Subsequent requests for the same profile update data in-place.
* **Smart Analytics & Business Logic**:
  * **Developer Score**: Calculated via `followers + total_stars + (public_repos * 2)`.
  * **Profile Health**: Categories (`Beginner`, `Growing`, `Good`, `Excellent`) derived from realistic developer score thresholds.
  * **Average Stars Per Repository**: Local computation.
  * **Recent Repositories**: Counts public repositories created within the last 12 months.
  * **Repository-to-Follower Ratio**: Handles division-by-zero errors gracefully.
* **Top 5 Repository Extraction**: Tracks top 5 projects ranked by star counts and links them back to the profile via foreign key constraints.
* **Advanced Pagination & Sorting**: Lists analyzed profiles with cursor/page parameters and custom sorts (by followers, developer score, or analyzed time).
* **Database Optimization**: Uses database transactions during upserts and deletions, indexing on frequently queried columns (`username`, `developer_score`, `followers`, `profile_id`), and cascading deletes.
* **Centralized Error Handling**: Express middleware maps third-party API limits, not-found users, database timeouts, and invalid usernames to uniform standard JSON responses.
* **Interactive API Docs**: Built-in Swagger UI documentation served at `/api-docs`.
* **Postman Collection**: Pre-configured JSON collection ready to import.

---

## 🛠 Tech Stack

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MySQL 8.0+ (using `mysql2/promise` with connection pooling)
* **HTTP Client**: Axios (configured with headers & token authorization)
* **Documentation**: Swagger UI (`swagger-ui-express`)
* **Environment Configuration**: dotenv

---

## 📐 Architecture & Separation of Concerns

The project follows a modular **Controller-Service-Repository** pattern to ensure testability, maintainability, and clean code:

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

* **App Entry (`src/app.js`)**: Starts the server, loads environment variables, configures CORS/JSON parsers, serves Swagger UI, and registers the global error handler.
* **Routes (`src/routes/githubRoutes.js`)**: Maps URLs to controller functions. Contains collision safeguards (declares static routes before wildcard route mappings).
* **Controllers (`src/controllers/githubController.js`)**: Handles HTTP requests. Validates inputs (such as validating GitHub username patterns) and parses parameters before invoking services.
* **Services (`src/services/githubService.js`)**: Encapsulates business logic, database transactions, database queries, and external API requests.
* **Utilities (`src/utils/analytics.js`)**: Pure, side-effect-free helper functions for computing metrics, developer scores, and profile health classifications.
* **Middlewares (`src/middlewares/errorHandler.js`)**: Catches operational errors, Axios issues, and DB failures, mapping them to standard JSON errors.

---

## 🗄 Database Schema Design

The database consists of two tables with a **one-to-many (1:N)** relationship and cascade delete integrity.

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

* **Table `github_profiles`**: Holds aggregated developer stats. Indexing applied on `username`, `developer_score`, and `followers` to speed up pagination, sorting, and single-user lookups.
* **Table `top_repositories`**: Tracks the user's top 5 starred repositories. Linked via `profile_id` referencing `github_profiles(id) ON DELETE CASCADE`. Indexing applied on `profile_id` for fast query joins.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v16.0 or higher)
* [MySQL Server](https://www.mysql.com/) (v8.0 or higher)

### 2. Clone the Repository
```bash
git clone <repository-url>
cd github-profile-analyzer
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your details:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=github_analyzer
   
   # Highly recommended: Personal Access Token to avoid GitHub API rate limits
   GITHUB_TOKEN=ghp_yourpersonaltokenhere
   ```

### 5. Database Setup
Log in to your MySQL shell and create the database, then load the schema:
```sql
CREATE DATABASE github_analyzer;
```
Or load the schema using command-line:
```bash
mysql -u root -p github_analyzer < database/schema.sql
```

---

## 🚀 Running the Application

### Development Mode (with hot-reloading)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Once running, you can access:
* **Swagger Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
* **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 📘 API Documentation Summary

All endpoints return a standardized JSON format:

* **Success**: `{ "success": true, "message": "...", "data": {} }`
* **Error**: `{ "success": false, "message": "..." }`

### 1. Analyze Profile
* **Endpoint**: `POST /api/profile/:username`
* **Description**: Fetches profile data and repositories from GitHub, calculates metrics, and stores/refreshes them in the database. Returns analyzed results.
* **Response Status**: `200 OK` (created or updated), `400 Bad Request` (invalid username), `404 Not Found` (GitHub user not found).

### 2. Refresh Profile
* **Endpoint**: `PUT /api/profile/:username/refresh`
* **Description**: Forces re-fetching profile and repository details from GitHub to overwrite current database records.
* **Response Status**: `200 OK` (updated), `404 Not Found` (profile not analyzed yet).

### 3. Get All Profiles
* **Endpoint**: `GET /api/profiles`
* **Parameters**:
  * `page` (optional, default: 1)
  * `limit` (optional, default: 10)
  * `sort` (optional, default: `analyzed_at`. Options: `followers`, `developer_score`, `analyzed_at`, `id`)
* **Description**: Paginated list of profiles sorted descending.

### 4. Search Profiles
* **Endpoint**: `GET /api/profiles/search?q=keyword`
* **Parameters**:
  * `q` (required) - search text matching name or username (case-insensitive)
  * `page`, `limit` (optional)
* **Description**: Returns matching profiles sorted by developer score descending.

### 5. Get Single Profile
* **Endpoint**: `GET /api/profiles/:username`
* **Description**: Returns saved profile analytics and top 5 repositories.

### 6. Delete Profile
* **Endpoint**: `DELETE /api/profiles/:username`
* **Description**: Deletes profile and all matching top repositories from the database.

### 7. Stats Endpoint
* **Endpoint**: `GET /api/stats`
* **Description**: Returns total profile counts, averages, and the most common language.

---

## 📊 Sample Response Payload

### Successful Profile Analysis (`POST /api/profile/octocat`)
```json
{
  "success": true,
  "message": "Profile analyzed and saved successfully",
  "data": {
    "profile": {
      "id": 1,
      "username": "octocat",
      "name": "The Octocat",
      "bio": "Testing branch",
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
      },
      {
        "repo_name": "octocat.github.io",
        "stars": 50,
        "forks": 12,
        "language": "HTML",
        "repo_url": "https://github.com/octocat/octocat.github.io"
      }
    ]
  }
}
```

---

## ☁️ Deployment Guidelines

The backend is fully configured for cloud hosting environments (such as Render or Railway).

### Steps to Deploy on Render/Railway
1. **Database**: Spin up a MySQL database on Render or Railway. Run `schema.sql` to initialize the database tables.
2. **Web Service**: Create a Node.js web service pointing to your GitHub repository.
3. **Environment Variables**: Add host configuration credentials to your web service settings:
   * `PORT=10000` (Render will set this automatically)
   * `DB_HOST=<your-cloud-db-host>`
   * `DB_PORT=<your-cloud-db-port>`
   * `DB_USER=<your-cloud-db-username>`
   * `DB_PASSWORD=<your-cloud-db-password>`
   * `DB_NAME=<your-cloud-db-name>`
   * `GITHUB_TOKEN=<your-github-token>` (Optional, but required to support high-traffic usage)
4. **Start Command**: Set build and start commands:
   * Build command: `npm install`
   * Start command: `npm start`
