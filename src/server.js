require("dotenv").config();
const express = require("express");
const apiRoutes = require("./routes");
const mysql = require("mysql");

const cookieParser = require("cookie-parser");
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "8429",
  database: process.env.DB_DATABASE || "test",
  port: process.env.DB_PORT || "3306",
});
const { sequelize } = require("./models/index.js");
const { Product } = require("./models").sequelize.models;
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

// 파일 저장을 위한 multer 설정
const upload = multer({ dest: "uploads/" });

const dummyProducts = [
  { product_name: "퉁퉁이별티" },
  { product_name: "퉁퉁이팥티" },
  { product_name: "퉁퉁이유자티" },
  { product_name: "활성엽산" },
];

const driver = () => {
  sequelize
    .sync()
    .then(() => {
      console.log("초기화 완료.");
      dummyProducts.forEach(async (product) => {
        await Product.findOrCreate({
          where: { product_name: product.product_name },
          defaults: product, // 이 부분에서 더미 데이터의 나머지 필드를 채울 수 있습니다.
        });
      });

      console.log("Dummy data inserted into Products table");
    })
    .catch((err) => {
      console.error("초기화 실패");
      console.error(err);
    });
};
driver();

const app = express();
app.use(cookieParser());
app.use("/api", apiRoutes);
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

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});

// Adding a new route for testing purposes
