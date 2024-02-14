require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");

const {
  writeToSpreadsheet,
  updateCancellationSheet,
} = require("./utils/spreadsheet");
const {
  getAuthUrl,
  fetchToken,
  fetchOrdersCount,
  fetchAllOrders,
  fetchOrdersWithStatus,
} = require("./api/cafe24/cafe24Api");

const app = express();
app.use(cookieParser());

const port = process.env.PORT || 3000;

// 인증 페이지로 리다이렉트하는 라우트
app.get("/auth", (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

// 리다이렉트 URI로 설정한 경로, 인증 코드를 받아 토큰을 요청
app.get("/callback", async (req, res) => {
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

// 주문 목록을 받아오고 구글 스프레드시트를 업데이트하는 라우트
app.get("/update-spreadsheet", async (req, res) => {
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

    await writeToSpreadsheet({ orders: allOrders });

    const cancellationOrders = await fetchOrdersWithStatus(
      accessToken,
      startDate,
      endDate,
      "C00,C10,R00,R10,E00,E10" // 취소, 반품, 교환 상태 코드
    );
    await updateCancellationSheet({ orders: cancellationOrders });
    await res.send("스프레드시트가 성공적으로 업데이트 되었습니다.");
  } catch (error) {
    handleError(res, error);
  }
});

app.listen(port, () => {
  console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});

function getDateRange(daysAgo) {
  let today = new Date();
  let pastDate = new Date();
  pastDate.setDate(today.getDate() - daysAgo);

  const startDate = pastDate.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];
  return { startDate, endDate };
}

function handleError(res, error) {
  console.error("Error status:", error.response?.status || "No status");
  console.error("Error data:", error.response?.data || error.message);
  res.status(error.response?.status || 500).send("처리 중 에러 발생");
}
