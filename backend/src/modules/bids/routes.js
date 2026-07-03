const express = require('express');
const router = express.Router();
const { authenticate } = require('../../common/auth');
const { validate } = require('../../common/validate');
const { placeBidSchema } = require('./validation');
const bidController = require('./controller');

/**
 * @swagger
 * /api/v1/auctions/{id}/bids:
 *   post:
 *     tags: [Bids]
 *     summary: Place a bid on an auction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bid placed
 *       400:
 *         description: Bid rejected
 */
router.post('/:id/bids', authenticate, validate(placeBidSchema), bidController.placeBid);

/**
 * @swagger
 * /api/v1/auctions/{id}/bids:
 *   get:
 *     tags: [Bids]
 *     summary: Get bid history for an auction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bid history
 */
router.get('/:id/bids', bidController.getBidsByAuction);

module.exports = router;
