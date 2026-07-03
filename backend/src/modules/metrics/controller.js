const { registry, getMetricsText } = require('../../common/metrics');

async function getMetrics(req, res) {
  res.setHeader('Content-Type', registry.contentType);
  res.end(await getMetricsText());
}

module.exports = { getMetrics };
