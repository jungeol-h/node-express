// src/api/coupangRoute.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { processCoupangFile } = require("../services/coupangService");

// 파일 업로드를 위한 multer 설정
const upload = multer({ dest: "uploads/" });

// 쿠팡 파일 업로드 및 처리 라우트
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send("파일이 업로드되지 않았습니다.");
    }

    // 쿠팡 파일 처리 서비스 함수 호출
    const transformedData = await processCoupangFile(
      file.path,
      file.originalname
    );
    res.json({ message: "파일 처리 완료", data: transformedData });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
