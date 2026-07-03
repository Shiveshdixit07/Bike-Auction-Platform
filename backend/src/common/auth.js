const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const logger = require('../config/logger');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug({
        event: 'auth_attempt',
        path: req.originalUrl,
        method: req.method,
        reason: 'no_token',
      }, 'Auth failed: no token provided');
      return res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      logger.warn({
        event: 'unauthorized_access',
        path: req.originalUrl,
        method: req.method,
        reason: 'user_not_found',
      }, 'Auth failed: user not found');
      return res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User not found',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.debug({
        event: 'auth_attempt',
        path: req.originalUrl,
        method: req.method,
        reason: 'token_expired',
      }, 'Auth failed: token expired');
      return res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token expired',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    }
    logger.warn({
      event: 'unauthorized_access',
      path: req.originalUrl,
      method: req.method,
      reason: 'invalid_token',
    }, 'Auth failed: invalid token');
    return res.status(401).json({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    logger.warn({
      event: 'admin_access_denied',
      path: req.originalUrl,
      method: req.method,
      userId: req.user.id,
      userRole: req.user.role,
    }, 'Admin access denied: non-admin user');
    return res.status(403).json({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Admin access required',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
