const auctionService = require('./service');

async function createAuction(req, res, next) {
  try {
    const auction = await auctionService.createAuction(req.body, req.user.id);
    res.status(201).json({
      statusCode: 201,
      data: { auction },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function getAuction(req, res, next) {
  try {
    const auction = await auctionService.getAuctionById(req.params.id);
    if (!auction) {
      return res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: 'Auction not found',
        timestamp: new Date().toISOString(),
      });
    }
    res.json({
      statusCode: 200,
      data: { auction },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function listAuctions(req, res, next) {
  try {
    const result = await auctionService.listAuctions(req.query);
    res.json({
      statusCode: 200,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function updateAuction(req, res, next) {
  try {
    const auction = await auctionService.updateAuction(req.params.id, req.body);
    if (!auction) {
      return res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: 'Auction not found',
        timestamp: new Date().toISOString(),
      });
    }
    res.json({
      statusCode: 200,
      data: { auction },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function publishAuction(req, res, next) {
  try {
    const auction = await auctionService.publishAuction(req.params.id, req.user.id);
    res.json({
      statusCode: 200,
      data: { auction },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function cancelAuction(req, res, next) {
  try {
    const auction = await auctionService.cancelAuction(req.params.id, req.user.id);
    res.json({
      statusCode: 200,
      data: { auction },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function settleAuction(req, res, next) {
  try {
    const auction = await auctionService.settleAuction(req.params.id, req.user.id);
    res.json({
      statusCode: 200,
      data: { auction },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createAuction, getAuction, listAuctions, updateAuction, publishAuction, cancelAuction, settleAuction };
