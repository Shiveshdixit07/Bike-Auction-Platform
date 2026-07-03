const logger = require('../config/logger');

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error({
      err,
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      statusCode,
    });
  } else if (statusCode >= 400) {
    logger.warn({
      event: 'request_error',
      err: { type: err.name, message: err.message },
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      statusCode,
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'A database error occurred',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      statusCode: 400,
      error: 'Validation Error',
      message: err.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid ID format',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors?.map((e) => e.path).join(', ') || 'field';
    return res.status(409).json({
      statusCode: 409,
      error: 'Conflict',
      message: `Duplicate value for: ${fields}`,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors?.map((e) => e.message) || [err.message];
    return res.status(400).json({
      statusCode: 400,
      error: 'Validation Error',
      message: messages.join('; '),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  res.status(statusCode).json({
    statusCode,
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message: statusCode === 500 ? 'An unexpected error occurred' : err.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

module.exports = errorHandler;
