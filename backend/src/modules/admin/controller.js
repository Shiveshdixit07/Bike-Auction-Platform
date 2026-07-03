const adminService = require('./service');

async function getDashboard(req, res, next) {
  try {
    const dashboard = await adminService.getDashboard();
    res.json({
      statusCode: 200,
      data: { dashboard },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
