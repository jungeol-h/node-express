// const { google } = require("googleapis");

// async function writeToSpreadsheet(orderData) {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: "testfortalk2her-f6326ece0892.json",
//     scopes: "https://www.googleapis.com/auth/spreadsheets",
//   });

//   const client = await auth.getClient();
//   const sheets = google.sheets({ version: "v4", auth: client });

//   const values = orderData.orders.map((order) => {
//     return [
//       order.order_id,
//       order.order_date,
//       order.payment_amount,
//       order.additional_shipping_fee,
//     ];
//   });

//   const request = {
//     spreadsheetId: "1dIxJGxdmrcnG-3IkB8-9BoiLCQ2EHNHY5dtKhoaq9H0",
//     range: "시트1",
//     valueInputOption: "RAW",
//     resource: { values: values },
//   };

//   try {
//     const response = await sheets.spreadsheets.values.append(request);
//     console.log(`${response.data.updates.updatedCells} cells appended.`);
//   } catch (err) {
//     console.error(err);
//   }
// }

// module.exports = { writeToSpreadsheet };

const { google } = require("googleapis");

async function writeToSpreadsheet(orderData) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "testfortalk2her-f6326ece0892.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 스프레드시트에 쓸 첫 번째 행의 칼럼 이름
  const headers = [
    "order_id",
    "shop_no",
    "start_date",
    "end_date",
    "order_status",
    "payment_status",
    "member_type",
    "group_no",
    "buyer_name",
    "receiver_name",
    "name_furigana",
    "receiver_address",
    "member_id",
    "member_email",
    "product_no",
    "product_code",
    "date_type",
    "supplier_id",
    "order_place_id",
    "buyer_cellphone",
    "buyer_phone",
    "buyer_email",
    "inflow_path",
    "subscription",
    "market_order_no",
    "market_cancel_request",
    "payment_method",
    "payment_gateway_name",
    "market_seller_id",
    "discount_method",
    "discount_code",
    "carrier_id",
    "labels",
    "refund_status",
    "limit",
    "offset",
    // 추가적인 칼럼 이름을 여기에 추가하세요.
  ];

//   // 모든 주문 정보를 포함하는 배열 생성
//   const values = orderData.orders.map((order) => {
//     // 주문 정보에서 필요한 데이터를 추출하여 배열로 반환
//     return headers.map((header) => {
//       // 각 헤더에 맞는 주문 정보를 반환 (주문 정보가 없는 경우 빈 문자열 반환)
//       return order[header] || "";
//     });
//   });

//   // 첫 번째 행(칼럼 이름)을 값 배열 앞에 추가
//   values.unshift(headers);

//   const request = {
//     spreadsheetId: "1dIxJGxdmrcnG-3IkB8-9BoiLCQ2EHNHY5dtKhoaq9H0",
//     range: "시트1", // 적절한 시트 이름으로 변경
//     valueInputOption: "RAW",
//     resource: { values: values },
//   };

//   try {
//     const response = await sheets.spreadsheets.values.append(request);
//     console.log(`${response.data.updates.updatedCells} cells appended.`);
//   } catch (err) {
//     console.error("The API returned an error: " + err);
//   }
// }

// module.exports = { writeToSpreadsheet };

const { google } = require("googleapis");

async function writeToSpreadsheet(orderData) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "testfortalk2her-f6326ece0892.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 대시보드에 표시할 정보를 선택합니다.
  const headers = [
    "Order ID", "Order Date", "Payment Date", "Customer ID", "Customer Email", 
    "Payment Method", "Total Payment Amount", "Shipping Type", "Shipping Fee", 
    "Discount Amount", "Tax Amount", "Order Status", "Payment Status"
  ];

  // 주문 정보에서 선택한 정보만 추출하여 스프레드시트에 매핑합니다.
  const values = orderData.orders.map(order => {
    return [
      order.order_id,
      order.order_date,
      order.payment_date,
      order.member_id,
      order.member_email,
      order.payment_method.join(", "), // 여러 결제 방법을 문자열로 결합
      order.actual_order_amount.payment_amount,
      order.shipping_type_text,
      order.actual_order_amount.shipping_fee,
      order.initial_order_amount.coupon_discount_price, // 예시로 쿠폰 할인금액을 할인 금액으로 사용
      order.tax_detail.map(tax => tax.amount).join(", "), // 여러 세금 정보를 문자열로 결합
      order.shipping_status === "T" ? "Shipped" : "Pending", // 배송 상태를 더 읽기 쉬운 형태로 변환
      order.paid === "T" ? "Paid" : "Unpaid"
    ];
  });

  values.unshift(headers); // 헤더를 값 배열의 맨 앞에 추가합니다.

  const request = {
    spreadsheetId: "1dIxJGxdmrcnG-3IkB8-9BoiLCQ2EHNHY5dtKhoaq9H0",
    range: "Dashboard!A1", // "Dashboard" 시트의 A1 셀부터 시작
    valueInputOption: "RAW",
    resource: { values: values },
  };

  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log(`${response.data.updates.updatedCells} cells appended.`);
  } catch (err) {
    console.error('The API returned an error: ' + err);
  }
}

module.exports = { writeToSpreadsheet };
