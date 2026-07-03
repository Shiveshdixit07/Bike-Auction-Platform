const healthService = require('./service');

async function health(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

async function readiness(req, res) {
  const result = await healthService.checkReadiness();
  const statusCode = result.status === 'ok' ? 200 : 503;

  res.status(statusCode).json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { health, readiness };
