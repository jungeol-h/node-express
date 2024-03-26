const express = require("express");
const router = express.Router();
const { handleError } = require("../utils/error");
const naverService = require("../services/naverService"); // naverService를 import 합니다.
const {
  fetchAuthToken,
  fetchProductOrderDetails,
} = require("../api/naver/naverApi");

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

router.get("/get-product-order-details", async (req, res) => {
  try {
    const authToken = await fetchAuthToken();

    const ids = req.query.ids;
    if (!ids) {
      return res.status(400).send("상품 ID를 입력해주세요.");
    }

    const details = await fetchProductOrderDetails(authToken.access_token, ids);
    res.json(details);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
