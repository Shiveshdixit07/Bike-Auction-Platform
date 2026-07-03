const authService = require('./service');

async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    res.status(201).json({
      statusCode: 201,
      data: { user, accessToken, refreshToken },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    res.json({
      statusCode: 200,
      data: { user, accessToken, refreshToken },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.refresh(req.body.refreshToken);
    res.json({
      statusCode: 200,
      data: { user, accessToken, refreshToken },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh };
