const Joi = require('joi');

const createAuctionSchema = Joi.object({
  bikeId: Joi.string().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  startingPrice: Joi.number().min(0).required(),
  bidIncrement: Joi.number().min(1).required(),
  reservePrice: Joi.number().min(0).allow(null).default(null),
  extendOnLastMinuteBid: Joi.boolean().default(true),
});

const updateAuctionSchema = Joi.object({
  startTime: Joi.date().iso(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')),
  startingPrice: Joi.number().min(0),
  bidIncrement: Joi.number().min(1),
  reservePrice: Joi.number().min(0).allow(null),
  extendOnLastMinuteBid: Joi.boolean(),
}).min(1);

const listAuctionsSchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'SETTLED', 'CANCELLED'),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  search: Joi.string().max(100),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  make: Joi.string().max(100),
});

module.exports = { createAuctionSchema, updateAuctionSchema, listAuctionsSchema };
