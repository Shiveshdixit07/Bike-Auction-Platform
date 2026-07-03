const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../../common/auth');
const adminController = require('./controller');

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       403:
 *         description: Admin access required
 */
router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboard);

module.exports = router;
