const express = require("express");
const cafe24Routes = require("./cafe24Routes");
const naverRoutes = require("./naverRoutes");

const router = express.Router();

router.use("/cafe24", cafe24Routes);
router.use("/naver", naverRoutes);

module.exports = router;
