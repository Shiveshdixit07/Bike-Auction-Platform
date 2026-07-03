const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../../common/auth');
const { validate } = require('../../common/validate');
const { createBikeSchema, updateBikeSchema } = require('./validation');
const bikeController = require('./controller');

/**
 * @swagger
 * /api/v1/bikes:
 *   post:
 *     tags: [Bikes]
 *     summary: Create a new bike (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Bike created
 */
router.post('/', authenticate, requireAdmin, validate(createBikeSchema), bikeController.createBike);

/**
 * @swagger
 * /api/v1/bikes:
 *   get:
 *     tags: [Bikes]
 *     summary: Get all bikes
 *     responses:
 *       200:
 *         description: List of bikes
 */
router.get('/', bikeController.getAllBikes);

/**
 * @swagger
 * /api/v1/bikes/{id}:
 *   get:
 *     tags: [Bikes]
 *     summary: Get bike by ID
 *     responses:
 *       200:
 *         description: Bike details
 */
router.get('/:id', bikeController.getBike);

/**
 * @swagger
 * /api/v1/bikes/{id}:
 *   patch:
 *     tags: [Bikes]
 *     summary: Update bike (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bike updated
 */
router.patch('/:id', authenticate, requireAdmin, validate(updateBikeSchema), bikeController.updateBike);

/**
 * @swagger
 * /api/v1/bikes/{id}:
 *   delete:
 *     tags: [Bikes]
 *     summary: Delete bike (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bike deleted
 */
router.delete('/:id', authenticate, requireAdmin, bikeController.deleteBike);

module.exports = router;
