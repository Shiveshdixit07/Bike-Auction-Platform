const express = require('express');
const router = express.Router();
const metricsController = require('./controller');

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags: [Metrics]
 *     summary: Prometheus metrics
 *     description: Returns application metrics in Prometheus exposition format
 *     responses:
 *       200:
 *         description: Metrics text
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/', metricsController.getMetrics);

module.exports = router;
