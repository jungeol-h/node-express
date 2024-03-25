const express = require("express");
const router = express.Router();
const {
  getAuthUrlCafe24,
  fetchToken,
  saveTokens,
} = require("../api/cafe24/cafe24Api");
const {
  handleAuthCallback, // Assuming you will no longer need this since we're using fetchToken directly.
  updateSpreadsheets,
} = require("../services/cafe24Service");
const { loadTokens } = require("../api/cafe24/cafe24Api");
const { handleError } = require("../utils/error");

router.get("/auth", (req, res) => {
  const authUrl = getAuthUrlCafe24();
  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  try {
    // Use the fetchToken function from cafe24Api.js to get the tokens.
    const { access_token, refresh_token } = await fetchToken(req.query.code);
    // Save tokens to a file using the saveTokens function from cafe24Api.js.
    await saveTokens({
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    // Set cookies with tokens if you still need them for other purposes,
    // though it's recommended to use tokens from your secured storage (e.g., token file).
    res.cookie("accessToken", access_token, { httpOnly: true, secure: true });
    res.cookie("refreshToken", refresh_token, { httpOnly: true, secure: true });

    res.send("cafe24 인증 완료! 창을 닫아주세요.");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("인증 중 에러 발생");
  }
});

router.get("/update", async (req, res) => {
  try {
    // Assuming you have a method to load tokens from the file where they were saved.
    const { accessToken } = await loadTokens(); // Modify to suit how you handle token loading.
    if (!accessToken) {
      return res.status(401).send("액세스 토큰이 쿠키에 없습니다.");
    }

    const date = req.query.date;
    if (!date) {
      return res.status(400).send("날짜를 입력해주세요.");
    }
    await updateSpreadsheets(accessToken, date);

    res.send("cafe24 성공적으로 업데이트 되었습니다.");
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
