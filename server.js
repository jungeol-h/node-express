require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cookieParser());

const { writeToSpreadsheet } = require("./spreadsheet");

const port = process.env.PORT || 3000;
const clientId = process.env.CAFE24_CLIENT_ID;
const clientSecret = process.env.CAFE24_CLIENT_SECRET;
const redirectUri = process.env.CAFE24_REDIRECT_URI;

// 인증 페이지로 리다이렉트하는 라우트
app.get("/auth", (req, res) => {
  const authUrl = `https://talk2her.cafe24api.com/api/v2/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=mall.read_order&state=12345`;
  res.redirect(authUrl);
});

// 리다이렉트 URI로 설정한 경로, 인증 코드를 받아 토큰을 요청
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);

  try {
    const response = await axios.post(
      "https://talk2her.cafe24api.com/api/v2/oauth/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    // 쿠키에 액세스 및 리프레시 토큰 저장
    res.cookie("accessToken", response.data.access_token, {
      httpOnly: true,
      secure: true,
    });
    res.cookie("refreshToken", response.data.refresh_token, {
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
    const accessToken = req.cookies.accessToken; // 쿠키에서 액세스 토큰 가져오기
    if (!accessToken) {
      return res.status(401).send("액세스 토큰이 쿠키에 없습니다.");
    }

    // 현재 날짜와 7일 전 날짜 계산
    let today = new Date();
    let sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const startDate = sevenDaysAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    // 주문 수 확인
    const countResponse = await axios.get(
      "https://talk2her.cafe24api.com/api/v2/admin/orders/count",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        params: { start_date: startDate, end_date: endDate },
      }
    );

    let totalOrders = countResponse.data.count;
    let limit = 1000;
    let offset = 0;
    let allOrders = [];
    let paymentStatus = "P";

    // 1000개씩 주문 데이터를 받아옴
    while (totalOrders > 0) {
      const response = await axios.get(
        "https://talk2her.cafe24api.com/api/v2/admin/orders",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            start_date: startDate,
            end_date: endDate,
            payment_status: paymentStatus,
            limit,
            offset,
            embed: "items",
          },
        }
      );

      allOrders = allOrders.concat(response.data.orders);
      offset += limit;
      totalOrders -= limit;
    }

    // 모든 주문 데이터를 스프레드시트에 업데이트
    await writeToSpreadsheet({ orders: allOrders });
    res.send("스프레드시트가 성공적으로 업데이트 되었습니다.");
  } catch (error) {
    console.error("Error status:", error.response?.status || "No status");
    console.error("Error data:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .send("주문 목록 조회 중 에러 발생");
  }
});

app.listen(port, () => {
  console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});
