function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        statusCode: 400,
        error: 'Validation Error',
        message: details.join(', '),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    }

    req.body = value;
    next();
  };
}

module.exports = { validate };
