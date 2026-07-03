const bikeService = require('./service');

async function createBike(req, res, next) {
  try {
    const bike = await bikeService.createBike(req.body);
    res.status(201).json({
      statusCode: 201,
      data: { bike },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function getBike(req, res, next) {
  try {
    const bike = await bikeService.getBikeById(req.params.id);
    if (!bike) {
      return res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: 'Bike not found',
        timestamp: new Date().toISOString(),
      });
    }
    res.json({
      statusCode: 200,
      data: { bike },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function getAllBikes(req, res, next) {
  try {
    const { make, condition, year, page = 1, limit = 20 } = req.query;
    const result = await bikeService.getAllBikes({ make, condition, year }, parseInt(page), parseInt(limit));
    res.json({
      statusCode: 200,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function updateBike(req, res, next) {
  try {
    const bike = await bikeService.updateBike(req.params.id, req.body);
    if (!bike) {
      return res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: 'Bike not found',
        timestamp: new Date().toISOString(),
      });
    }
    res.json({
      statusCode: 200,
      data: { bike },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function deleteBike(req, res, next) {
  try {
    const bike = await bikeService.deleteBike(req.params.id);
    if (!bike) {
      return res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: 'Bike not found',
        timestamp: new Date().toISOString(),
      });
    }
    res.json({
      statusCode: 200,
      message: 'Bike deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createBike, getBike, getAllBikes, updateBike, deleteBike };
