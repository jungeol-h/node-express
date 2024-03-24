const axios = require("axios");
const bcrypt = require("bcrypt");
require("dotenv").config();

// 환경 변수에서 클라이언트 ID와 클라이언트 시크릿 로드
const clientId = process.env.NAVER_CLIENT_ID;
const clientSecret = process.env.NAVER_CLIENT_SECRET;
const tokenUrl = "https://api.commerce.naver.com/external/v1/oauth2/token";

/**
 * 전자서명을 생성하는 함수
 */
function generateSignature() {
  //   const timestamp = Date.now(); // 현재 시간의 밀리초 단위 Unix 시간
  //   const password = `${clientId}_${timestamp}`; // 클라이언트 ID와 타임스탬프를 밑줄로 연결

  //   // bcrypt 해싱
  //   const salt = bcrypt.genSaltSync(10); // salt 생성
  //   const hashed = bcrypt.hashSync(password, salt);

  //   // base64 인코딩
  //   const signature = Buffer.from(hashed, "utf-8").toString("base64");

  const bcrypt = require("bcrypt");

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const timestamp = Date.now();
  // 밑줄로 연결하여 password 생성
  const password = `${clientId}_${timestamp}`;
  // bcrypt 해싱
  const hashed = bcrypt.hashSync(password, clientSecret);
  // base64 인코딩
  //   console.log(Buffer.from(hashed, "utf-8").toString("base64"));
  const signature = Buffer.from(hashed, "utf-8").toString("base64");
  return { signature, timestamp };
}

/**
 * 인증 토큰을 발급받는 함수
 */
async function fetchAuthToken() {
  const { signature, timestamp } = generateSignature();

  try {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("timestamp", timestamp);
    params.append("grant_type", "client_credentials");
    params.append("client_secret_sign", signature); // 전자서명
    params.append("type", "SELF"); // 혹은 'SELF', 상황에 맞게 선택

    const response = await axios.post(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data; // 토큰 정보 반환
  } catch (error) {
    console.error("인증 토큰 발급 중 오류 발생:", error);
    throw error;
  }
}

// Adding a new function to fetch last changed product order statuses
// This is a simplified example. Error handling and other logic might be necessary.
// Fetches last changed product orders with pagination to handle more than 300 changes
async function fetchLastChangedProductOrders(authToken, lastChangedFrom) {
  const endpoint =
    "https://api.commerce.naver.com/external/v1/pay-order/seller/product-orders/last-changed-statuses";
  let allProductOrders = [];
  let hasMore = true;
  let currentFrom = lastChangedFrom;
  let moreSequence = null;

  while (hasMore) {
    const params = new URLSearchParams({
      lastChangedFrom: currentFrom,
    });
    if (moreSequence) {
      params.append("moreSequence", moreSequence);
    }

    try {
      const response = await axios.get(`${endpoint}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      allProductOrders = allProductOrders.concat(
        response.data.data.lastChangeStatuses
      );
      hasMore = !!response.data.data.more;
      if (hasMore) {
        currentFrom = response.data.data.more.moreFrom;
        moreSequence = response.data.data.more.moreSequence;
      }
    } catch (error) {
      console.error("Error fetching last changed product orders:", error);
      throw error;
    }
  }

  return allProductOrders;
}

/**
 * 상품 주문 상세 내역 조회
 */
// Fetches product order details in chunks to handle more than 300 IDs
async function fetchProductOrderDetails(authToken, productOrderIds) {
  const endpoint =
    "https://api.commerce.naver.com/external/v1/pay-order/seller/product-orders/query";
  const chunkSize = 300;
  let allDetails = [];

  for (let i = 0; i < productOrderIds.length; i += chunkSize) {
    const chunk = productOrderIds.slice(i, i + chunkSize);

    try {
      const response = await axios.post(
        endpoint,
        { productOrderIds: chunk },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      allDetails = allDetails.concat(response.data);
    } catch (error) {
      console.error("Error fetching product order details:", error);
      throw error;
    }
  }

  return allDetails;
}

module.exports = {
  fetchAuthToken,
  fetchLastChangedProductOrders,
  fetchProductOrderDetails,
};
