// 환경 변수 설정
require("dotenv").config();

// 모듈 임포트
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const apiRoutes = require("./src/routes");

const mysql = require("mysql");
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "8429",
  database: process.env.DB_DATABASE || "test",
  port: process.env.DB_PORT || "3306",
});
const nunjucks = require("nunjucks");
const { sequelize } = require("./src/models/index.js");
const { Product } = require("./src/models").sequelize.models;
// Express 앱 초기화
const app = express();

// 데이터베이스 연결 설정

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL Database.");
});

// 뷰 엔진 설정
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "njk");
nunjucks.configure("views", {
  express: app,
  autoescape: true,
  watch: true,
});

// 미들웨어 설정
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Multer 설정
const upload = multer({ dest: "uploads/" });

// Sequelize 동기화 및 더미 데이터 삽입
sequelize
  .sync()
  .then(() => {
    console.log("Database synchronized.");
    // 더미 데이터 삽입 로직
    const dummyProducts = [
      { product_name: "퉁퉁이별티" },
      { product_name: "퉁퉁이팥티" },
      { product_name: "퉁퉁이유자티" },
      { product_name: "이노시톨" },
      { product_name: "루이보스" },
      { product_name: "활성엽산" },
      { product_name: "뷰티풀디" },
      { product_name: "블렌딩티콜렉션" },
    ];
    dummyProducts.forEach(async (product) => {
      await Product.findOrCreate({
        where: { product_name: product.product_name },
        defaults: product, // 이 부분에서 더미 데이터의 나머지 필드를 채울 수 있습니다.
      });
    });

    console.log("Dummy data inserted into Products table");
  })
  .catch((err) => {
    console.error("Failed to synchronize database:", err);
  });

// 라우트
const indexRouter = require("./src/routes/index");
// const usersRouter = require('./routes/users'); // 사용자 정의 라우트가 필요하다면 추가

app.use("/", indexRouter);
app.use("/api", apiRoutes);
// app.use('/users', usersRouter);

// 파일 업로드 라우트
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("파일이 업로드되지 않았습니다.");
  }

  // 파일 이름에서 날짜 추출 (예시: 'sales_2023-01-01.xlsx')
  // 실제 구현에서는 파일 이름 형식에 맞게 조정해야 합니다.
  const fileName = file.originalname;
  const datePattern = /(\d{4})(\d{2})(\d{2})~/;
  const match = fileName.match(datePattern);
  if (!match) {
    return res.status(400).send("파일 이름에서 날짜를 추출할 수 없습니다.");
  }
  // 날짜 형식을 'YYYY-MM-DD'로 변환합니다.
  const orderDate = `${match[1]}-${match[2]}-${match[3]}`; // 예: '2024-02-20'
  // 업로드된 파일의 경로를 가져옵니다.
  const filePath = file.path;

  // 파일을 읽어옵니다.
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(sheet);

  // 변환된 데이터 구조로 가공
  const transformedData = {
    orderdate: orderDate,
    items: rawData.filter((item) => item["노출상품ID"] !== "합 계"), // '합 계' 항목 제외
  };

  console.log(transformedData);

  // 임시 업로드 파일 삭제
  fs.unlinkSync(filePath);

  res.send("파일이 성공적으로 처리되었습니다.");
});

// 404 에러 핸들러
app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// 에러 핸들러
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

// 서버 시작
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
