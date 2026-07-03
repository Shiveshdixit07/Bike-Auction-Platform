const Joi = require('joi');

const createBikeSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000).required(),
  images: Joi.array().items(Joi.string().uri()).max(10).default([]),
  make: Joi.string().max(100).required(),
  model: Joi.string().max(100).required(),
  year: Joi.number().min(1900).max(new Date().getFullYear() + 1).required(),
  mileage: Joi.number().min(0).required(),
  condition: Joi.string().valid('EXCELLENT', 'GOOD', 'FAIR', 'POOR').required(),
  ownerNotes: Joi.string().max(1000).allow('', null).default(''),
});

const updateBikeSchema = Joi.object({
  title: Joi.string().max(200),
  description: Joi.string().max(2000),
  images: Joi.array().items(Joi.string().uri()).max(10),
  make: Joi.string().max(100),
  model: Joi.string().max(100),
  year: Joi.number().min(1900).max(new Date().getFullYear() + 1),
  mileage: Joi.number().min(0),
  condition: Joi.string().valid('EXCELLENT', 'GOOD', 'FAIR', 'POOR'),
  ownerNotes: Joi.string().max(1000),
}).min(1);

module.exports = { createBikeSchema, updateBikeSchema };
