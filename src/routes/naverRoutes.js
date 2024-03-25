const express = require("express");
const router = express.Router();
const { handleError } = require("../utils/error");
const naverService = require("../services/naverService"); // naverService를 import 합니다.

router.get("/test-fetch", async (req, res) => {
  try {
    const lastChangedFromInput = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    await naverService.insertProductOrderDetails(lastChangedFromInput); // naverService로 로직 이동

    res.send("업데이트 테스트!");
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
