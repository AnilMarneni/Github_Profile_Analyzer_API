const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    description: 'A backend service built with Node.js, Express, and MySQL to analyze GitHub user profiles and repository metrics.'
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
        description: 'Checks server and database connection status.',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' },
                example: {
                  success: true,
                  message: 'Service is healthy',
                  data: { status: 'ok', database: 'connected' }
                }
              }
            }
          },
          500: {
            description: 'Service is unhealthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  message: 'Service is unhealthy: Database connection failed'
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
        summary: 'Get Aggregate Statistics',
        description: 'Returns aggregate statistics across all analyzed profiles.',
        responses: {
          200: {
            description: 'Stats retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' },
                example: {
                  success: true,
                  message: 'Statistics retrieved successfully',
                  data: {
                    total_profiles: 5,
                    average_followers: 24.8,
                    average_stars: 104.2,
                    top_developer_score: 520,
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
        summary: 'Analyze and Save Profile',
        description: 'Fetches user details and repositories from GitHub, calculates metrics, and stores or updates them in the database.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'octocat' }
          }
        ],
        responses: {
          200: {
            description: 'Analysis completed and saved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' },
                example: {
                  success: true,
                  message: 'Profile analyzed successfully',
                  data: {
                    profile: {
                      id: 1,
                      username: 'octocat',
                      name: 'The Octocat',
                      followers: 3200,
                      developer_score: 3450,
                      profile_health: 'Excellent'
                    },
                    top_repositories: [
                      { repo_name: 'hello-world', stars: 100, forks: 45, language: 'JavaScript' }
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
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Invalid GitHub username' }
              }
            }
          },
          404: {
            description: 'GitHub user not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'GitHub user not found' }
              }
            }
          }
        }
      }
    },
    '/api/profile/{username}/refresh': {
      put: {
        tags: ['Profiles'],
        summary: 'Refresh Existing Analysis',
        description: 'Re-analyzes and updates database records for an already stored GitHub user.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'octocat' }
          }
        ],
        responses: {
          200: {
            description: 'Profile refreshed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          404: {
            description: 'Profile not found in database',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Profile not found' }
              }
            }
          }
        }
      }
    },
    '/api/profiles': {
      get: {
        tags: ['Profiles'],
        summary: 'List Analyzed Profiles',
        description: 'Retrieves analyzed profiles with sorting and pagination controls.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['followers', 'developer_score', 'analyzed_at', 'id'], default: 'analyzed_at' }
          }
        ],
        responses: {
          200: {
            description: 'Profiles retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' },
                example: {
                  success: true,
                  message: 'Profiles retrieved successfully',
                  data: {
                    profiles: [{ id: 1, username: 'octocat', developer_score: 3450 }],
                    pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
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
        summary: 'Search Profiles',
        description: 'Searches analyzed profiles matching query in username or name.',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', example: 'octo' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          200: {
            description: 'Search results returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          400: {
            description: 'Query parameter q is missing',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/profiles/{username}': {
      get: {
        tags: ['Profiles'],
        summary: 'Get Single Profile',
        description: 'Gets details and top 5 repositories for an analyzed user.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'octocat' }
          }
        ],
        responses: {
          200: {
            description: 'Profile details returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          404: {
            description: 'Profile not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Profile not found' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Profiles'],
        summary: 'Delete Profile',
        description: 'Deletes profile and associated repositories.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'octocat' }
          }
        ],
        responses: {
          200: {
            description: 'Profile deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' },
                example: { success: true, message: 'Profile deleted successfully', data: null }
              }
            }
          },
          404: {
            description: 'Profile not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Profile not found' }
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
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
