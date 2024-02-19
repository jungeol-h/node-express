const express = require("express");
const router = express.Router();
const { getAuthUrlCafe24 } = require("../api/cafe24/cafe24Api");
const {
  handleAuthCallback,
  updateSpreadsheets,
} = require("../services/cafe24Service");
const { handleError } = require("../utils/error");

router.get("/auth", (req, res) => {
  const authUrl = getAuthUrlCafe24();
  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  try {
    const { accessToken, refreshToken } = await handleAuthCallback(
      req.query.code
    );
    res.cookie("accessToken", accessToken, { httpOnly: true, secure: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });
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

    await updateSpreadsheets(accessToken);
    res.send("스프레드시트가 성공적으로 업데이트 되었습니다.");
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
