const { google } = require("googleapis");

// 상수 정의
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "testfortalk2her-f6326ece0892.json",
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

async function getSheetProperties(sheets, sheetName) {
  const range = `${sheetName}!A1:ZZ1`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range,
  });
  return response.data.values[0]; // 첫 번째 행의 속성 이름
}
function objectToString(obj) {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (value === null || value === undefined) {
        return `${key}: N/A`;
      } else if (typeof value === "object") {
        return `${key}: ${objectToString(value)}`; // 재귀적으로 객체 처리
      } else {
        return `${key}: ${value.toString()}`;
      }
    })
    .join(", ");
}

function mapOrderDataToSheetFormat(orderData, attributes, platform) {
  if (platform === "cafe24" || platform === "naver") {
    return orderData.orders.map((order) => {
      return attributes.map((attr) => {
        // '상품명' 열에 대한 특별 처리
        if (attr === "상품명") {
          if (Array.isArray(order.items) && order.items.length > 0) {
            // items 배열 내 각 아이템의 product_name 추출 및 문자열로 결합
            return order.items
              .map((item) => item.product_name || "N/A")
              .join(", ");
          }
          return "N/A"; // items 배열이 비어있는 경우
        }

        // 다른 속성에 대한 처리
        let value = order[attr];
        if (typeof value === "object" && value !== null) {
          // 객체 타입의 속성 처리. objectToString 함수를 사용하여 재귀적으로 처리 가능
          return objectToString(value);
        } else if (value !== null && value !== undefined) {
          // 값이 null이나 undefined가 아닌 경우, 문자열로 변환
          return value.toString();
        } else {
          // 값이 null이나 undefined인 경우 "N/A" 반환
          return "N/A";
        }
      });
    });
  }
}

async function writeToSpreadsheet(orderData, sheetName, platform) {
  try {
    console.log("Sheet Name:", sheetName); // Add this line in both functions
    console.log("Google Sheets 클라이언트를 가져오는 중...");
    const sheets = await getGoogleSheetsClient();

    console.log("기존 주문 목록을 조회하는 중...");
    const existingOrderIds = await getOrderIdswithRow(sheets, sheetName);

    console.log("시트 속성을 가져오는 중...");
    const attributes = await getSheetProperties(sheets, sheetName);
    console.log(`시트 속성: ${attributes.join(", ")}`);
    console.log("새로운 주문을 필터링하는 중...");

    let newOrders;

    if (platform === "cafe24") {
      newOrders = orderData.orders.filter(
        (order) => !existingOrderIds.includes(order.order_id)
      );
    }
    if (platform === "naver") {
      console.log(
        "첫 번째 주문 데이터:",
        JSON.stringify(orderData.orders[0], null, 2)
      );

      newOrders = orderData.orders.filter(
        (order) => !existingOrderIds.includes(order.orderId)
      );
    }

    console.log(`추가될 새로운 주문 수: ${newOrders.length}`);

    if (newOrders.length === 0) {
      console.log("추가할 새로운 주문이 없습니다.");
      return;
    }

    // 첫 번째 새로운 주문의 상세 정보 로그 출력
    // if (newOrders.length > 0) {
    //   console.log(
    //     "첫 번째 새로운 주문의 상세 정보:",
    //     JSON.stringify(newOrders[0], null, 2)
    //   );
    // }

    console.log("새로운 주문 데이터를 스프레드시트 형식으로 매핑하는 중...");
    const values = mapOrderDataToSheetFormat(
      { orders: newOrders },
      attributes,
      platform
    );
    console.log(`매핑된 데이터: ${JSON.stringify(values[0], null, 2)}`); // 첫 번째 매핑된 데이터 로그 출력

    console.log("스프레드시트에 데이터를 추가하는 중...");
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: "RAW",
      resource: { values },
    });

    console.log(
      `${newOrders.length}개의 새로운 주문이 스프레드시트에 추가되었습니다.`
    );
  } catch (err) {
    console.error("API 호출 중 오류 발생: ", err);
  }
}

async function getOrderIdswithRow(sheets, sheetName) {
  const range = `${sheetName}!A2:A`; // 주문 ID가 있는 컬럼 지정
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range,
  });
  return response.data.values ? response.data.values.flat() : [];
}
async function updateCancellationSheet(orderData, sheetName, platform) {
  try {
    console.log("Google Sheets 클라이언트를 가져오는 중...");
    const sheets = await getGoogleSheetsClient();

    // 'cafe24_취소' 시트의 기존 order_id 목록 조회
    const existingOrderIds = await getOrderIdswithRow(sheets, sheetName);

    console.log("시트 속성을 가져오는 중...");
    const attributes = await getSheetProperties(sheets, sheetName);

    console.log(
      "취소/반품/환불 주문 데이터를 스프레드시트 형식으로 매핑하는 중..."
    );
    const filteredOrders = orderData.orders.filter(
      (order) => !existingOrderIds.includes(order.order_id)
    );
    const values = mapOrderDataToSheetFormat(
      { orders: filteredOrders },
      attributes,
      platform
    );

    if (values.length === 0) {
      console.log("추가할 새로운 취소/반품/환불 주문이 없습니다.");
      return;
    }

    console.log("스프레드시트에 데이터를 추가하는 중...");
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: "RAW",
      resource: { values },
    });

    console.log("스프레드시트 업데이트 완료.");
  } catch (err) {
    console.error("API 호출 중 오류 발생: ", err);
  }
}

module.exports = { writeToSpreadsheet, updateCancellationSheet };
