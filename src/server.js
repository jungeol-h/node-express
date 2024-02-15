require("dotenv").config();
const express = require("express");
const apiRoutes = require("./routes");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
app.use("/api", apiRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});

// Adding a new route for testing purposes
