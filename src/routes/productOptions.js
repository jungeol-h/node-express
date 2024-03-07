// routes/productOptions.js
const express = require("express");
const router = express.Router();
const productOptionService = require("../services/productOptionService");

router.post("/", async (req, res) => {
  const data = req.body;
  const productOption = await productOptionService.createProductOption(data);
  res.status(201).send(productOption);
});

router.get("/", async (req, res) => {
  const productOptions = await productOptionService.getAllProductOptions();
  res.status(200).send(productOptions);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const productOption = await productOptionService.getProductOptionById(id);
  if (productOption) {
    res.status(200).send(productOption);
  } else {
    res.status(404).send({ message: "ProductOption not found" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  console.log("data", data);
  try {
    await productOptionService.updateProductOption(id, data);
    console.log("ProductOption updated successfully");
    res.status(200).send({ message: "ProductOption updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "An error occurred while updating the product option.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await productOptionService.deleteProductOption(id);
  res.status(200).send({ message: "ProductOption deleted successfully" });
});

module.exports = router;
