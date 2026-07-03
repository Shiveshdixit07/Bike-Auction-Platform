const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../../common/auth');
const { validate } = require('../../common/validate');
const { createAuctionSchema, updateAuctionSchema } = require('./validation');
const auctionController = require('./controller');

/**
 * @swagger
 * /api/v1/auctions:
 *   post:
 *     tags: [Auctions]
 *     summary: Create a new auction (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Auction created
 */
router.post('/', authenticate, requireAdmin, validate(createAuctionSchema), auctionController.createAuction);

/**
 * @swagger
 * /api/v1/auctions:
 *   get:
 *     tags: [Auctions]
 *     summary: List auctions with filters
 *     responses:
 *       200:
 *         description: List of auctions
 */
router.get('/', auctionController.listAuctions);

/**
 * @swagger
 * /api/v1/auctions/{id}:
 *   get:
 *     tags: [Auctions]
 *     summary: Get auction by ID
 *     responses:
 *       200:
 *         description: Auction details
 */
router.get('/:id', auctionController.getAuction);

/**
 * @swagger
 * /api/v1/auctions/{id}:
 *   patch:
 *     tags: [Auctions]
 *     summary: Update auction (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auction updated
 */
router.patch('/:id', authenticate, requireAdmin, validate(updateAuctionSchema), auctionController.updateAuction);

/**
 * @swagger
 * /api/v1/auctions/{id}/publish:
 *   post:
 *     tags: [Auctions]
 *     summary: Publish auction (admin only, DRAFT -> SCHEDULED)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auction published
 */
router.post('/:id/publish', authenticate, requireAdmin, auctionController.publishAuction);

/**
 * @swagger
 * /api/v1/auctions/{id}/cancel:
 *   post:
 *     tags: [Auctions]
 *     summary: Cancel auction (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auction cancelled
 */
router.post('/:id/cancel', authenticate, requireAdmin, auctionController.cancelAuction);

/**
 * @swagger
 * /api/v1/auctions/{id}/settle:
 *   post:
 *     tags: [Auctions]
 *     summary: Settle auction (admin only, ENDED -> SETTLED or CANCELLED)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auction settled
 */
router.post('/:id/settle', authenticate, requireAdmin, auctionController.settleAuction);

module.exports = router;
