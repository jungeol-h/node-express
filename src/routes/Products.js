// routes/Products.js
const express = require("express");
const router = express.Router();
const ProductService = require("../services/ProductService");

router.post("/", async (req, res) => {
  const data = req.body;
  const Product = await ProductService.createProduct(data);
  res.status(201).send(Product);
});

router.get("/", async (req, res) => {
  const Products = await ProductService.getAllProducts();
  res.status(200).send(Products);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const Product = await ProductService.getProductById(id);
  if (Product) {
    res.status(200).send(Product);
  } else {
    res.status(404).send({ message: "ProductProduct not found" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  await ProductService.updateProduct(id, data);
  res.status(200).send({ message: "ProductProduct updated successfully" });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await ProductService.deleteProduct(id);
  res.status(200).send({ message: "ProductProduct deleted successfully" });
});

module.exports = router;
