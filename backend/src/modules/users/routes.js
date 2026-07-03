const express = require('express');
const router = express.Router();
const { authenticate } = require('../../common/auth');

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    statusCode: 200,
    data: { user: req.user },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
