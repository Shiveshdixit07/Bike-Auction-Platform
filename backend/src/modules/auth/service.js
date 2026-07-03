const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../../models');
const config = require('../../config');
const logger = require('../../config/logger');

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
  return { accessToken, refreshToken };
}

async function register({ name, email, password, role }) {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    logger.warn({ event: 'user_register_failed', email, reason: 'email_taken' }, 'Registration failed: email already registered');
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password,
    role: role || 'BUYER',
  });

  logger.info({ event: 'user_registered', userId: user.id, email, role: user.role }, 'User registered');

  await AuditLog.create({
    actor: user.id,
    action: 'REGISTER',
    entityType: 'USER',
    entityId: user.id,
    metadata: { email, role: user.role },
  });

  const tokens = generateTokens(user.id);
  return { user, ...tokens };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    logger.warn({ event: 'user_login_failed', email, reason: 'user_not_found' }, 'Login failed: user not found');
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    logger.warn({ event: 'user_login_failed', email, reason: 'wrong_password' }, 'Login failed: wrong password');
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  logger.info({ event: 'user_login_success', userId: user.id, email }, 'User logged in');

  const tokens = generateTokens(user.id);
  return { user, ...tokens };
}

async function refresh(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      logger.warn({ event: 'token_refresh_failed', reason: 'user_not_found' }, 'Token refresh failed: user not found');
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }
    const tokens = generateTokens(user.id);
    return { user, ...tokens };
  } catch (err) {
    if (err.statusCode) throw err;
    logger.warn({ event: 'token_refresh_failed', reason: 'invalid_token' }, 'Token refresh failed: invalid token');
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }
}

module.exports = { register, login, refresh };
