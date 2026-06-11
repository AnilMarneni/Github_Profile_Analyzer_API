/**
 * Swagger (OpenAPI 3.0) Configuration
 * Defines static API documentation for the Express endpoints.
 */

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    description: 'A production-ready backend service designed for a Node.js Intern assignment. It analyzes GitHub profiles, calculates developer metrics, and stores insights in a MySQL database.',
    contact: {
      name: 'GitHub Profile Analyzer API Support',
      email: 'admin@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Service Health Check',
        description: 'Verifies the application is running and the database connection is established.',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StandardResponse'
                },
                example: {
                  success: true,
                  message: 'Service is healthy',
                  data: {
                    status: 'ok',
                    database: 'connected'
                  }
                }
              }
            }
          },
          500: {
            description: 'Service is unhealthy (e.g., database disconnected)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                },
                example: {
                  success: false,
                  message: 'Service is unhealthy'
                }
              }
            }
          }
        }
      }
    },
    '/api/stats': {
      get: {
        tags: ['Analytics'],
        summary: 'Retrieve Aggregate Statistics',
        description: 'Calculates aggregate statistics across all analyzed GitHub profiles in the database.',
        responses: {
          200: {
            description: 'Statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StandardResponse'
                },
                example: {
                  success: true,
                  message: 'Aggregate statistics retrieved successfully',
                  data: {
                    total_profiles: 12,
                    average_followers: 124.5,
                    average_stars: 45.2,
                    top_developer_score: 1850,
                    most_common_language: 'JavaScript'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/profile/{username}': {
      post: {
        tags: ['Profiles'],
        summary: 'Analyze and Save GitHub Profile',
        description: 'Fetches user details and repositories from GitHub, calculates metrics, and stores/updates them in the database. Operates as an upsert.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'The GitHub username to analyze',
            schema: {
              type: 'string',
              example: 'octocat'
            }
          }
        ],
        responses: {
          200: {
            description: 'Profile analyzed and saved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StandardResponse'
                },
                example: {
                  success: true,
                  message: 'Profile analyzed and saved successfully',
                  data: {
                    profile: {
                      id: 1,
                      username: 'octocat',
                      name: 'The Octocat',
                      bio: 'Testing branch',
                      avatar_url: 'https://avatars.githubusercontent.com/u/5832347?v=4',
                      github_url: 'https://github.com/octocat',
                      followers: 9840,
                      following: 9,
                      public_repos: 8,
                      total_stars: 154,
                      total_forks: 32,
                      total_watchers: 154,
                      most_used_language: 'Ruby',
                      developer_score: 9866,
                      profile_health: 'Excellent',
                      avg_stars_per_repo: 19.25,
                      recent_repos_created: 1,
                      account_age_years: 15.3,
                      repo_follower_ratio: 0.0008,
                      github_created_at: '2011-01-25T18:44:36.000Z',
                      analyzed_at: '2026-06-11T12:00:00.000Z'
                    },
                    top_repositories: [
                      {
                        repo_name: 'git-consortium',
                        stars: 64,
                        forks: 18,
                        language: 'Ruby',
                        repo_url: 'https://github.com/octocat/git-consortium'
                      }
                    ]
                  }
                }
              }
            }
          },
          400: {
            description: 'Invalid username format',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                },
                example: {
                  success: false,
                  message: 'Invalid GitHub username format.'
                }
              }
            }
          },
          404: {
            description: 'GitHub user not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                },
                example: {
                  success: false,
                  message: 'GitHub user not found'
                }
              }
            }
          }
        }
      }
    },
    '/api/profile/{username}/refresh': {
      put: {
        tags: ['Profiles'],
        summary: 'Refresh Existing Profile Analysis',
        description: 'Re-fetches details for a profile already analyzed in the database and updates metrics.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'The GitHub username to refresh',
            schema: {
              type: 'string',
              example: 'octocat'
            }
          }
        ],
        responses: {
          200: {
            description: 'Profile refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StandardResponse'
                }
              }
            }
          },
          404: {
            description: 'Profile not found in database',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                },
                example: {
                  success: false,
                  message: 'Profile not found. Use POST /api/profile/:username to analyze for the first time.'
                }
              }
            }
          }
        }
      }
    },
    '/api/profiles': {
      get: {
        tags: ['Profiles'],
        summary: 'Get All Analyzed Profiles',
        description: 'Retrieves a list of all analyzed user profiles with sorting and pagination controls.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            description: 'Page number for pagination',
            schema: {
              type: 'integer',
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Number of items per page',
            schema: {
              type: 'integer',
              default: 10
            }
          },
          {
            name: 'sort',
            in: 'query',
            required: false,
            description: 'Field to sort profiles by (descending order)',
            schema: {
              type: 'string',
              enum: ['followers', 'developer_score', 'analyzed_at', 'id'],
              default: 'analyzed_at'
            }
          }
        ],
        responses: {
          200: {
            description: 'Profiles retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StandardResponse'
                },
                example: {
                  success: true,
                  message: 'Profiles retrieved successfully',
                  data: {
                    profiles: [
                      {
                        id: 1,
                        username: 'octocat',
                        name: 'The Octocat',
                        developer_score: 9866,
                        profile_health: 'Excellent'
                      }
                    ],
                    pagination: {
                      total: 1,
                      page: 1,
                      limit: 10,
                      totalPages: 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/profiles/search': {
      get: {
        tags: ['Profiles'],
        summary: 'Search Analyzed Profiles',
        description: 'Searches the local database for profiles matching the keyword in username or name.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            description: 'Keyword to search by (username or name)',
            schema: {
              type: 'string',
              example: 'octo'
            }
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Limit size',
            schema: {
              type: 'integer',
              default: 10
            }
          }
        ],
        responses: {
          200: {
            description: 'Search results returned',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StandardResponse'
                }
              }
            }
          },
          400: {
            description: 'Search parameter q is missing',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/profiles/{username}': {
      get: {
        tags: ['Profiles'],
        summary: 'Get Single Analyzed Profile',
        description: 'Retrieves complete stored metrics and the top 5 repositories for a specific user from the database.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'The GitHub username',
            schema: {
              type: 'string',
              example: 'octocat'
            }
          }
        ],
        responses: {
          200: {
            description: 'Profile details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StandardResponse'
                }
              }
            }
          },
          404: {
            description: 'Profile not analyzed yet',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Profiles'],
        summary: 'Delete Analyzed Profile',
        description: 'Removes the profile and all associated top repositories from the database.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'The GitHub username to delete',
            schema: {
              type: 'string',
              example: 'octocat'
            }
          }
        ],
        responses: {
          200: {
            description: 'Profile deleted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StandardResponse'
                },
                example: {
                  success: true,
                  message: 'Profile deleted successfully',
                  data: null
                }
              }
            }
          },
          404: {
            description: 'Profile not found in database',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the operation was successful'
          },
          message: {
            type: 'string',
            description: 'Descriptive feedback message'
          },
          data: {
            type: 'object',
            description: 'Payload returned by the endpoint'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error description'
          }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
