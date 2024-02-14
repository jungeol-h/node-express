const { google } = require("googleapis");

async function writeToSpreadsheet(orderData) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "testfortalk2her-f6326ece0892.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 시트의 첫 번째 행(속성 이름이 있는 행)을 읽어옵니다.
  const sheetProperties = await sheets.spreadsheets.values.get({
    spreadsheetId: "1dIxJGxdmrcnG-3IkB8-9BoiLCQ2EHNHY5dtKhoaq9H0",
    range: "Sheet1!A1:Z1",
  });

  // 첫 번째 행에서 읽어온 속성 이름을 배열로 저장합니다.
  const attributes = sheetProperties.data.values[0];

  // 주문 정보에서 선택한 정보만 추출하여 스프레드시트에 매핑합니다.
  const values = orderData.orders.map((order) => {
    return attributes.map((attr) => {
      // 옵셔널 체이닝과 기본값을 사용하여 안전하게 속성에 접근
      if (attr === "Payment Method") {
        return order.payment_method?.join(", ") || "N/A"; // 기본값으로 "N/A"
      } else if (attr === "Tax Amounts") {
        return order.tax_detail?.map((tax) => tax.amount).join(", ") || "N/A";
      }
      // attr을 기반으로 주문 데이터에서 해당하는 값을 찾아 매핑
      // 실제 속성 이름과 order 객체의 키 이름 매핑 로직 필요
      // 예시: attr -> orderKey 변환 로직 적용
      const orderKey = transformAttrToOrderKey(attr);
      return order[orderKey] ?? "N/A"; // 기본값으로 "N/A", orderKey가 order 객체에 없으면 "N/A" 반환
    });
  });

  const request = {
    spreadsheetId: "1dIxJGxdmrcnG-3IkB8-9BoiLCQ2EHNHY5dtKhoaq9H0",
    range: "Sheet1",
    valueInputOption: "RAW",
    resource: { values },
  };

  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log(`${response.data.updates.updatedCells} cells appended.`);
  } catch (err) {
    console.error("The API returned an error: " + err);
  }
}

function transformAttrToOrderKey(attr) {
  // attr에서 order 객체의 키로 변환하는 로직 구현
  // 이는 attr의 형식과 order 객체의 키 형식에 따라 달라집니다.
  // 예시 로직: 속성 이름을 소문자로 변환하고, 공백을 '_'로 대체
  return attr.toLowerCase().replace(/\s+/g, "_");
}

module.exports = { writeToSpreadsheet };
