const Joi = require('joi');

const placeBidSchema = Joi.object({
  amount: Joi.number().min(0).required(),
});

const getBidsSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

module.exports = { placeBidSchema, getBidsSchema };
