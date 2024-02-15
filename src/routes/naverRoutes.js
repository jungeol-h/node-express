const express = require("express");
const router = express.Router();
const {
  fetchAuthToken,
  fetchLastChangedProductOrders,
  fetchProductOrderDetails,
} = require("../api/naver/naverApi");
const { handleError } = require("../utils/error");
const { writeToSpreadsheet } = require("../utils/spreadsheet");

// 평탄화 함수 수정
function flattenDetailsData(details) {
  return details.map((detail) => ({
    ...detail.productOrder,
    ...detail.delivery,
    ...detail.order,
    // detail 내의 다른 정보가 필요하다면 여기에 추가
  }));
}

router.get("/test-fetch", async (req, res) => {
  try {
    const authToken = await fetchAuthToken();
    const kstOffset = 9 * 60; // KST는 UTC보다 9시간 앞서 있음
    // 현재 시간을 KST로 설정
    const now = new Date(new Date().getTime() + kstOffset * 60000);
    // 현재 시간에서 7일을 빼고 KST로 설정
    const sevenDaysAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const lastChangedFrom = sevenDaysAgo.toISOString().replace("Z", "+09:00");

    // 현재 시간에서 10분을 빼고 KST로 설정
    const tenMinutesAgo = new Date(now.getTime() - 1 * 24 * 60 * 1000);
    const lastChangedTo = tenMinutesAgo.toISOString().replace("Z", "+09:00");

    const changedOrdersData = await fetchLastChangedProductOrders(
      authToken.access_token,
      lastChangedFrom,
      lastChangedTo
    );

    if (
      !changedOrdersData.data.lastChangeStatuses ||
      changedOrdersData.data.lastChangeStatuses.length === 0
    ) {
      return res.status(404).send("주문 목록이 없습니다.");
    }

    const productOrderIds = changedOrdersData.data.lastChangeStatuses.map(
      (status) => status.productOrderId
    );

    const details = await fetchProductOrderDetails(
      authToken.access_token,
      productOrderIds
    );
    const flattenedDetails = flattenDetailsData(details.data);

    // 상세 정보가 포함된 데이터를 응답으로 반환
    // res.json(details);
    await writeToSpreadsheet(
      {
        orders: flattenedDetails,
      },
      process.env.NAVER_SHEET_NAME,
      "naver"
    );
    res.send("구글 스프레드시트에 주문 정보를 업데이트했습니다.");
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
