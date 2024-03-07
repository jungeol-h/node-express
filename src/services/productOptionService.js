// services/productOptionService.js
const { ProductOption } = require("../models").sequelize.models;

const createProductOption = async (data) => {
  return await ProductOption.create(data);
};

const getAllProductOptions = async () => {
  return await ProductOption.findAll();
};

const getProductOptionById = async (id) => {
  return await ProductOption.findByPk(id);
};

const updateProductOption = async (id, data) => {
  return await ProductOption.update(data, { where: { product_option_id: id } });
};

const deleteProductOption = async (id) => {
  return await ProductOption.destroy({ where: { product_option_id: id } });
};

module.exports = {
  createProductOption,
  getAllProductOptions,
  getProductOptionById,
  updateProductOption,
  deleteProductOption,
};
