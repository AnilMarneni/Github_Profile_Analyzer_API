class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production' || !err.isOperational) {
    console.error('Error occurred:', err.message || err);
  }

  // GitHub API integration errors
  if (err.isAxiosError || (err.response && err.response.status)) {
    const status = err.response.status;
    if (status === 404) {
      statusCode = 404;
      message = 'GitHub user not found';
    } else if (status === 403) {
      const remaining = err.response.headers['x-ratelimit-remaining'];
      statusCode = 403;
      message = remaining === '0' 
        ? 'GitHub API rate limit exceeded' 
        : 'GitHub API access forbidden';
    } else {
      statusCode = status || 502;
      message = 'GitHub API communication error';
    }
  }

  // MySQL database errors
  if (err.code && (err.code.startsWith('ER_') || err.sqlState)) {
    statusCode = 500;
    message = 'Database operation failed';
    console.error('SQL Error details:', err.message);
  }

  // JSON formatting issues
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  AppError,
  errorHandler
};
