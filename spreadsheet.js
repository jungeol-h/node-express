const { google } = require("googleapis");

async function writeToSpreadsheet(orderData) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "testfortalk2her-f6326ece0892.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 스프레드시트의 첫 번째 행(속성 이름이 있는 행)을 읽어옵니다.
  const sheetPropertiesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: "1dIxJGxdmrcnG-3IkB8-9BoiLCQ2EHNHY5dtKhoaq9H0",
    range: "시트1!A1:ZZ1",
  });

  // 첫 번째 행에서 읽어온 속성 이름을 배열로 저장합니다.
  const attributes = sheetPropertiesResponse.data.values[0];

  // 주문 정보에서 선택한 정보만 추출하여 스프레드시트에 매핑합니다.
  const values = orderData.orders.map((order) => {
    return attributes.map((attr) => {
      // payment_method와 tax_detail 같은 특수 처리가 필요한 필드를 확인합니다.
      if (attr === "payment_method") {
        // payment_method가 배열인 경우, 쉼표로 구분된 문자열로 변환합니다.
        return order.payment_method ? order.payment_method.join(", ") : "N/A";
      } else if (attr === "tax_detail") {
        // tax_detail 정보를 적절한 문자열 형태로 변환합니다.
        return order.tax_detail
          ? order.tax_detail
              .map((tax) => `${tax.name}: ${tax.amount}`)
              .join(", ")
          : "N/A";
      } else {
        // 그 외의 경우에는 직접 속성에 접근합니다.
        return order[attr] ?? "N/A";
      }
    });
  });

  const request = {
    spreadsheetId: "1dIxJGxdmrcnG-3IkB8-9BoiLCQ2EHNHY5dtKhoaq9H0",
    range: "시트1",
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

module.exports = { writeToSpreadsheet };
