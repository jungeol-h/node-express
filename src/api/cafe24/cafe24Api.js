const axios = require("axios");
require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");

const clientId = process.env.CAFE24_CLIENT_ID;
const clientSecret = process.env.CAFE24_CLIENT_SECRET;
const redirectUri = process.env.CAFE24_REDIRECT_URI;
const tokenFilePath = path.join(__dirname, "../token.json");

async function saveTokens({ accessToken, refreshToken }) {
  const tokens = { accessToken, refreshToken };
  await fs.writeFile(tokenFilePath, JSON.stringify(tokens));
}

async function loadTokens() {
  try {
    const tokens = await fs.readFile(tokenFilePath, "utf8");
    return JSON.parse(tokens);
  } catch (error) {
    console.error("Failed to load tokens:", error);
    return null;
  }
}
// 인증 페이지 URL 생성
function getAuthUrlCafe24() {
  const authUrl = `https://talk2her.cafe24api.com/api/v2/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=mall.read_order&state=12345`;
  return authUrl;
}
// 리프레시 토큰을 이용하여 액세스 토큰 갱신
async function refreshTokens(refreshToken) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

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
          day_type: "pay_date",
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

// 특정 주문 상태에 해당하는 주문 정보 가져오기
async function fetchOrdersWithStatus(
  accessToken,
  startDate,
  endDate,
  orderStatus
) {
  let limit = 1000; // 한 번에 요청할 주문의 최대 개수
  let offset = 0; // 데이터 시작 위치
  let filteredOrders = []; // 필터링된 주문을 저장할 배열

  // 주문 상태에 따라 여러 번의 API 호출을 통해 모든 해당 주문 정보를 가져옴
  while (true) {
    const response = await axios.get(
      `https://talk2her.cafe24api.com/api/v2/admin/orders`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        params: {
          start_date: startDate,
          end_date: endDate,
          limit,
          offset,
          order_status: orderStatus, // 주문 상태 필터링
          embed: "items,receivers,buyer,return,cancellation,exchange", // 추가 정보 포함
        },
      }
    );

    // 가져온 주문 정보를 배열에 추가
    filteredOrders = filteredOrders.concat(response.data.orders);

    // 모든 주문 정보를 가져왔는지 확인
    if (response.data.orders.length < limit) {
      break; // 더 이상 가져올 주문 정보가 없으면 반복 종료
    }

    offset += limit; // 다음 페이지로 오프셋 이동
  }

  return filteredOrders;
}

module.exports = {
  getAuthUrlCafe24,
  fetchToken,
  fetchOrdersCount,
  fetchAllOrders,
  fetchOrdersWithStatus,
  saveTokens,
  loadTokens,
  refreshTokens,
};
