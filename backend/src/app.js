const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const logger = require('./config/logger');
const { requestId } = require('./common/requestId');
const { metricsMiddleware } = require('./common/metrics');
const errorHandler = require('./common/errorHandler');

const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/users/routes');
const bikeRoutes = require('./modules/bikes/routes');
const auctionRoutes = require('./modules/auctions/routes');
const bidRoutes = require('./modules/bids/routes');
const adminRoutes = require('./modules/admin/routes');
const healthRoutes = require('./modules/health/routes');
const metricsRoutes = require('./modules/metrics/routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontend.url, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(requestId);
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id,
  autoLogging: {
    ignore: (req) => {
      const url = req.url || '';
      return url === '/health' || url === '/health/ready' || url === '/metrics';
    },
  },
}));
app.use(metricsMiddleware);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bike Auction Platform API',
      version: '1.0.0',
      description: 'Bike Auction Platform API',
    },
    servers: [{ url: `http://localhost:${config.port}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/*/routes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bikes', bikeRoutes);
app.use('/api/v1/auctions', auctionRoutes);
app.use('/api/v1/auctions', bidRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

module.exports = app;
