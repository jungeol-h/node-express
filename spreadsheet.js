const { google } = require("googleapis");

async function writeToSpreadsheet(orderData) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "testfortalk2her-f6326ece0892.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const values = orderData.orders.map((order) => {
    return [
      order.order_id,
      order.order_date,
      order.payment_amount,
      order.additional_shipping_fee,
    ];
  });

  const request = {
    spreadsheetId: "1dIxJGxdmrcnG-3IkB8-9BoiLCQ2EHNHY5dtKhoaq9H0",
    range: "시트1",
    valueInputOption: "RAW",
    resource: { values: values },
  };

  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log(`${response.data.updates.updatedCells} cells appended.`);
  } catch (err) {
    console.error(err);
  }
}

module.exports = { writeToSpreadsheet };
