// require("dotenv").config();
// const express = require("express");
// const axios = require("axios");
// const { writeToSpreadsheet } = require("./spreadsheet");

// const app = express();
// const port = process.env.PORT || 3000;

// // 환경 변수에서 클라이언트 ID, 비밀키, 리다이렉트 URI 불러오기
// const clientId = process.env.CAFE24_CLIENT_ID;
// const clientSecret = process.env.CAFE24_CLIENT_SECRET;
// const redirectUri = process.env.CAFE24_REDIRECT_URI;

// // 인증 페이지로 리다이렉트하는 라우트
// app.get("/auth", (req, res) => {
//   const authUrl = `https://talk2her.cafe24api.com/api/v2/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=mall.read_order&state=12345`;
//   res.redirect(authUrl);
//   console.log("test");
// });

// // 리다이렉트 URI로 설정한 경로. 인증 코드를 받아 토큰을 요청
// app.get("/callback", async (req, res) => {
//   const code = req.query.code;
//   // 클라이언트 ID와 클라이언트 시크릿을 Base64로 인코딩
//   const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
//     "base64"
//   );
//   const params = new URLSearchParams();
//   params.append("grant_type", "authorization_code");
//   params.append("code", code);
//   params.append("redirect_uri", redirectUri);

//   try {
//     const response = await axios.post(
//       "https://talk2her.cafe24api.com/api/v2/oauth/token",
//       params.toString(),
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//           // Basic 인증 스키마를 사용한 Authorization 헤더 추가
//           Authorization: `Basic ${credentials}`,
//         },
//       }
//     );

//     console.log(response.data);
//     res.send("인증 완료! 토큰을 확인하세요.");
//   } catch (error) {
//     console.error("Error status:", error.response?.status);
//     console.error("Error data:", error.response?.data);
//     res.status(error.response?.status || 500).send("인증 중 에러 발생");
//   }
// });

// // 주문 목록을 받아오는 라우트
// app.get("/orders", async (req, res) => {
//   try {
//     // 이전 단계에서 얻은 토큰
//     const accessToken = "ATh0taFEJBPlS3qVQkO8CD";

//     // 주문 목록을 검색할 매개 변수 설정
//     const params = {
//       start_date: "2024-01-01", // 시작일
//       end_date: "2024-02-01", // 종료일
//       // order_id: "your_order_id_here", // 특정 주문 번호
//     };

//     const response = await axios.get(
//       "https://talk2her.cafe24api.com/api/v2/admin/orders",
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//         params: params, // 매개 변수 추가
//       }
//     );
//     await writeToSpreadsheet(response.data);
//     res.json(response.data); // 주문 목록을 응답으로 보냄
//   } catch (error) {
//     console.error("Error status:", error.response?.status);
//     console.error("Error data:", error.response?.data);
//     res
//       .status(error.response?.status || 500)
//       .send("주문 목록 조회 중 에러 발생");
//   }
// });

// app.listen(port, () => {
//   console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
// });

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

    // 주문 목록을 검색할 매개 변수 설정
    const params = {
      start_date: "2024-01-01", // 시작일
      end_date: "2024-02-01", // 종료일
      // order_id: "your_order_id_here", // 특정 주문 번호 (필요한 경우)
    };

    const response = await axios.get(
      "https://talk2her.cafe24api.com/api/v2/admin/orders",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        params: params, // 매개 변수 추가
      }
    );

    // 구글 스프레드시트 업데이트 함수 호출
    await writeToSpreadsheet(response.data);
    res.send("스프레드시트가 성공적으로 업데이트 되었습니다.");
  } catch (error) {
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    res
      .status(error.response?.status || 500)
      .send("주문 목록 조회 중 에러 발생");
  }
});

app.listen(port, () => {
  console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});
