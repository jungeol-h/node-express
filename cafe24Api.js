const axios = require("axios");
require("dotenv").config();

const clientId = process.env.CAFE24_CLIENT_ID;
const clientSecret = process.env.CAFE24_CLIENT_SECRET;
const redirectUri = process.env.CAFE24_REDIRECT_URI;

// 인증 페이지 URL 생성
function getAuthUrl() {
  const authUrl = `https://talk2her.cafe24api.com/api/v2/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=mall.read_order&state=12345`;
  return authUrl;
}

// 인증 코드를 사용하여 토큰 획득
async function fetchToken(code) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);

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

  return response.data;
}

// 주문 수 확인
async function fetchOrdersCount(accessToken, startDate, endDate) {
  const response = await axios.get(
    "https://talk2her.cafe24api.com/api/v2/admin/orders/count",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      params: { start_date: startDate, end_date: endDate },
    }
  );

  return response.data.count;
}

// 모든 주문 정보 가져오기
async function fetchAllOrders(accessToken, startDate, endDate, totalOrders) {
  let limit = 1000;
  let offset = 0;
  let allOrders = [];
  let paymentStatus = "P";

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
    totalOrders -= limit > totalOrders ? totalOrders : limit;
  }

  return allOrders;
}

module.exports = {
  getAuthUrl,
  fetchToken,
  fetchOrdersCount,
  fetchAllOrders,
};
