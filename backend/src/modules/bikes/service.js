const { Bike } = require('../../models');

async function createBike(data) {
  return Bike.create(data);
}

async function getBikeById(id) {
  return Bike.findByPk(id);
}

async function getAllBikes(filters = {}, page = 1, limit = 20) {
  const where = {};
  if (filters.make) where.make = { [require('sequelize').Op.like]: `%${filters.make}%` };
  if (filters.condition) where.condition = filters.condition;
  if (filters.year) where.year = filters.year;

  const offset = (page - 1) * limit;
  const { rows: bikes, count: total } = await Bike.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });

  return {
    bikes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function updateBike(id, data) {
  const bike = await Bike.findByPk(id);
  if (!bike) return null;
  await bike.update(data);
  return bike;
}

async function deleteBike(id) {
  const bike = await Bike.findByPk(id);
  if (!bike) return null;
  await bike.destroy();
  return bike;
}

module.exports = { createBike, getBikeById, getAllBikes, updateBike, deleteBike };
