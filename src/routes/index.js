const express = require("express");
const cafe24Routes = require("./cafe24Routes");
const naverRoutes = require("./naverRoutes");
const coupangRoutes = require("./coupangRoutes");
const statsRoutes = require("./statsRoutes");
const productOptionRoutes = require("./productOptions");
const OptionRoutes = require("./Options");
const ProductRoutes = require("./Products");

const router = express.Router();

router.use("/cafe24", cafe24Routes);
router.use("/naver", naverRoutes);
router.use("/coupang", coupangRoutes);
router.use("/stats", statsRoutes);
router.use("/product-options", productOptionRoutes);
router.use("/options", OptionRoutes);
router.use("/products", ProductRoutes);

module.exports = router;
