const bidService = require('./service');

function getIO(req) {
  return req.app.get('io');
}

async function placeBid(req, res, next) {
  try {
    const io = getIO(req);
    const result = await bidService.placeBid(
      req.params.id,
      req.user.id,
      req.body.amount,
      io
    );

    if (result.rejected) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Bid Rejected',
        message: result.reason,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      statusCode: 201,
      data: { bid: result.bid },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function getBidsByAuction(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await bidService.getBidsByAuction(req.params.id, parseInt(page), parseInt(limit));
    res.json({
      statusCode: 200,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { placeBid, getBidsByAuction };
