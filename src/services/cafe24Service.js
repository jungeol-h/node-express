const {
  fetchToken,
  fetchOrdersCount,
  fetchAllOrders,
  fetchOrdersWithStatus,
} = require("../api/cafe24/cafe24Api");
const {
  writeToSpreadsheet,
  updateCancellationSheet,
} = require("../utils/spreadsheet");

function getDateRange(daysAgo) {
  let today = new Date();
  let pastDate = new Date();
  pastDate.setDate(today.getDate() - daysAgo);

  const startDate = pastDate.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];
  return { startDate, endDate };
}

async function handleAuthCallback(code) {
  try {
    const tokens = await fetchToken(code);
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  } catch (error) {
    console.error("Error in handleAuthCallback:", error);
    throw error;
  }
}

async function updateSpreadsheets(accessToken) {
  try {
    const { startDate, endDate } = getDateRange(7); // 7일 전 날짜부터 오늘까지
    const totalOrders = await fetchOrdersCount(accessToken, startDate, endDate);
    const allOrders = await fetchAllOrders(
      accessToken,
      startDate,
      endDate,
      totalOrders
    );
    await writeToSpreadsheet(
      {
        orders: allOrders,
      },
      process.env.CAFE24_SHEET_NAME,
      "cafe24"
    );

    const cancellationOrders = await fetchOrdersWithStatus(
      accessToken,
      startDate,
      endDate,
      "C40,R40,E40" // 취소, 반품, 교환 상태 코드
    );
    await updateCancellationSheet(
      {
        orders: cancellationOrders,
      },
      process.env.CAFE24_CANCELLATION_SHEET_NAME,
      "cafe24"
    );
  } catch (error) {
    console.error("Error in updateSpreadsheets:", error);
    throw error;
  }
}

module.exports = {
  handleAuthCallback,
  updateSpreadsheets,
};
