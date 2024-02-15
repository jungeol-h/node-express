const express = require("express");
const axios = require("axios");
const router = express.Router();
const {
  getAuthUrlCafe24,
  fetchToken,
  fetchOrdersCount,
  fetchAllOrders,
  fetchOrdersWithStatus,
} = require("../api/cafe24/cafe24Api");
const {
  writeToSpreadsheet,
  updateCancellationSheet,
} = require("../utils/spreadsheet");
const { handleError } = require("../utils/error");

function getDateRange(daysAgo) {
  let today = new Date();
  let pastDate = new Date();
  pastDate.setDate(today.getDate() - daysAgo);

  const startDate = pastDate.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];
  return { startDate, endDate };
}

router.get("/auth", (req, res) => {
  const authUrl = getAuthUrlCafe24();
  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  try {
    const tokens = await fetchToken(req.query.code);
    res.cookie("accessToken", tokens.access_token, {
      httpOnly: true,
      secure: true,
    });
    res.cookie("refreshToken", tokens.refresh_token, {
      httpOnly: true,
      secure: true,
    });
    res.send("인증 완료! 구글 스프레드시트를 업데이트 할 준비가 되었습니다.");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("인증 중 에러 발생");
  }
});

router.get("/update", async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).send("액세스 토큰이 쿠키에 없습니다.");
    }

    const { startDate, endDate } = getDateRange(7); // 7일 전 날짜부터 오늘까지
    const totalOrders = await fetchOrdersCount(accessToken, startDate, endDate);
    const allOrders = await fetchAllOrders(
      accessToken,
      startDate,
      endDate,
      totalOrders
    );
    await writeToSpreadsheet(
      {
        orders: allOrders,
      },
      process.env.CAFE24_SHEET_NAME,
      "cafe24"
    );

    const cancellationOrders = await fetchOrdersWithStatus(
      accessToken,
      startDate,
      endDate,
      "C40,R40,E40" // 취소, 반품, 교환 상태 코드
    );
    await updateCancellationSheet(
      {
        orders: cancellationOrders,
      },
      process.env.CAFE24_CANCELLATION_SHEET_NAME,
      "cafe24"
    );
    await res.send("스프레드시트가 성공적으로 업데이트 되었습니다.");
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
