const { google } = require("googleapis");
const express = require("express");
const router = express.Router();

// Google OAuth 클라이언트 설정
const auth = new google.auth.OAuth2(
  "YOUR_CLIENT_ID",
  "YOUR_CLIENT_SECRET",
  "YOUR_REDIRECT_URI"
);

// 인증 코드를 받아서 액세스 토큰을 얻는 라우트
router.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);

    // 주문 정보 가져오기
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: "YOUR_SPREADSHEET_ID",
      range: "Sheet1!A1:B10", // 가져올 데이터의 범위 지정
    });

    res.send(response.data.values);
  } catch (error) {
    console.error("Error retrieving access token:", error);
    res.status(500).send("Error retrieving access token");
  }
});

module.exports = router;
