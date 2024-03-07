// routes/Options.js
const express = require("express");
const router = express.Router();
const OptionService = require("../services/OptionService");

router.post("/", async (req, res) => {
  const data = req.body;
  const Option = await OptionService.createOption(data);
  res.status(201).send(Option);
});

router.get("/", async (req, res) => {
  const Options = await OptionService.getAllOptions();
  res.status(200).send(Options);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const Option = await OptionService.getOptionById(id);
  if (Option) {
    res.status(200).send(Option);
  } else {
    res.status(404).send({ message: "ProductOption not found" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  await OptionService.updateOption(id, data);
  res.status(200).send({ message: "Option updated successfully" });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await OptionService.deleteOption(id);
  res.status(200).send({ message: "ProductOption deleted successfully" });
});

module.exports = router;
