// services/productOptionService.js
const { Product } = require("../models").sequelize.models;

const createProduct = async (data) => {
  return await Product.create(data);
};

const getAllProducts = async () => {
  return await Product.findAll();
};

const getProductById = async (id) => {
  return await Product.findByPk(id);
};

const updateProduct = async (id, data) => {
  return await Product.update(data, { where: { product_id: id } });
};

const deleteProduct = async (id) => {
  return await Product.destroy({ where: { product_id: id } });
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
