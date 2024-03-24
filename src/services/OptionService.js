// services/productOptionService.js
const { Option } = require("../models").sequelize.models;

const createOption = async (data) => {
  return await Option.create(data);
};

const getAllOptions = async () => {
  return await Option.findAll();
};

const getOptionById = async (id) => {
  return await Option.findByPk(id);
};

// const updateOption = async (id, data) => {
//   return await Option.update(data, { where: { product_option_id: id } });
// };
const updateOption = async (id, data) => {
  // Correct the where clause to match options by their actual ID (option_id)
  return await Option.update(data, { where: { option_id: id } });
};

const deleteOption = async (id) => {
  return await Option.destroy({ where: { product_option_id: id } });
};

module.exports = {
  createOption,
  getAllOptions,
  getOptionById,
  updateOption,
  deleteOption,
};
