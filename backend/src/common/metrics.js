const client = require('prom-client');

const registry = new client.Registry();

registry.setDefaultLabels({ app: 'bike-auction-api' });

client.collectDefaultMetrics({ register: registry });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

const bidsPlaced = new client.Counter({
  name: 'bids_placed_total',
  help: 'Total number of bids placed',
  labelNames: ['status'],
});

const activeAuctions = new client.Gauge({
  name: 'active_auctions',
  help: 'Number of currently active auctions',
});

const wsConnections = new client.Gauge({
  name: 'ws_connections',
  help: 'Number of active WebSocket connections',
});

registry.registerMetric(httpRequestDuration);
registry.registerMetric(bidsPlaced);
registry.registerMetric(activeAuctions);
registry.registerMetric(wsConnections);

function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
  next();
}

async function getMetricsText() {
  return registry.metrics();
}

module.exports = { registry, metricsMiddleware, getMetricsText, bidsPlaced, activeAuctions, wsConnections };
