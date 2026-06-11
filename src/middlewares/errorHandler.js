/**
 * Custom Error class for operational errors.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express Error Handling Middleware.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log all errors in development, or only non-operational errors in production
  if (process.env.NODE_ENV !== 'production' || !err.isOperational) {
    console.error('--- ERROR LOG ---');
    console.error(err);
    console.error('-----------------');
  }

  // Handle Axios (GitHub API) Errors
  if (err.isAxiosError || (err.response && err.response.status)) {
    const status = err.response.status;
    if (status === 404) {
      statusCode = 404;
      message = 'GitHub user not found';
    } else if (status === 403) {
      const rateLimitRemaining = err.response.headers['x-ratelimit-remaining'];
      if (rateLimitRemaining === '0') {
        statusCode = 403;
        message = 'GitHub API rate limit exceeded. Please try again later or configure a GITHUB_TOKEN.';
      } else {
        statusCode = 403;
        message = 'GitHub API access forbidden.';
      }
    } else {
      statusCode = status || 502;
      message = `Error communicating with GitHub API: ${err.response.data?.message || err.message}`;
    }
  }

  // Handle MySQL Database Errors
  if (err.code && (err.code.startsWith('ER_') || err.sqlState)) {
    statusCode = 500;
    message = 'Database operation failed. Please check your query or database state.';
    // Log the exact error to the console for the reviewer
    console.error('MySQL Error Details:', err.message);
  }

  // Handle Express JSON parsing error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  AppError,
  errorHandler
};
