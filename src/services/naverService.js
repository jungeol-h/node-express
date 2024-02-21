const {
  fetchAuthToken,
  fetchLastChangedProductOrders,
  fetchProductOrderDetails,
} = require("../api/naver/naverApi");
const { writeToSpreadsheet } = require("../utils/spreadsheet");
const { Order } = require("../models").sequelize.models;
const { Item } = require("../models").sequelize.models;
const { ItemOption } = require("../models").sequelize.models;
const { ProductOptionItem } = require("../models").sequelize.models;

function getKSTDate(offsetDays = 0, offsetMinutes = 0) {
  const kstOffset = 9 * 60; // KST는 UTC보다 9시간 앞서 있음
  let date = new Date();
  date = new Date(
    date.getTime() +
      kstOffset * 60000 -
      offsetDays * 24 * 60 * 60 * 1000 -
      offsetMinutes * 60000
  );
  return date.toISOString().replace("Z", "+09:00");
}

function flattenDetailsData(details) {
  return details.map((detail) => ({
    ...detail.productOrder,
    ...detail.delivery,
    ...detail.order,
  }));
}

async function fetchAndProcessOrders() {
  const authToken = await fetchAuthToken();
  const lastChangedFrom = getKSTDate(7); // 7일 전
  const lastChangedTo = getKSTDate(0, 10); // 10분 전

  const changedOrdersData = await fetchLastChangedProductOrders(
    authToken.access_token,
    lastChangedFrom,
    lastChangedTo
  );

  if (
    !changedOrdersData.data.lastChangeStatuses ||
    changedOrdersData.data.lastChangeStatuses.length === 0
  ) {
    return [];
  }

  const productOrderIds = changedOrdersData.data.lastChangeStatuses.map(
    (status) => status.productOrderId
  );
  const details = await fetchProductOrderDetails(
    authToken.access_token,
    productOrderIds
  );
  return flattenDetailsData(details.data);
}

async function insertProductOrderDetails() {
  try {
    const allOrders = await fetchAndProcessOrders();
    // console.log("allOrders[0] : ");
    // console.log(allOrders[0]);
    for (const order of allOrders) {
      // 주문 정보 삽입
      const orderExists = await Order.findOne({
        where: { order_id: order.orderId },
      });
      if (!orderExists) {
        await Order.create({
          order_id: order.orderId,
          shop_num: 2,
          payment_amount: order.totalPaymentAmount,
          order_date: order.orderDate,
          order_name: order.ordererName,
          shipping_fee: order.deliveryFeeAmount,
          // 다른 주문 관련 필드...
        });
        console.log(`Order inserted: ${order.orderId}`);
      } else {
        console.log(`Order already exists, skipping: ${order.orderId}`);
      }

      const newItemData = {
        item_id: order.productOrderId,
        order_id: order.orderId,
        merchandise_name: order.productName,
        option_name: order.productOption,
        item_price: order.unitPrice,
        item_count: order.quantity,
      };
      const itemExists = await Item.findOne({
        where: { item_id: newItemData.item_id },
      });
      if (!itemExists) {
        const optionExists = await ItemOption.findOne({
          where: { option_name: newItemData.option_name },
        });

        if (!optionExists) {
          await ItemOption.create({
            option_name: newItemData.option_name,
            option_price: order.optionPrice,
          });
          console.log(`Option inserted: ${newItemData.option_name}`);
        }

        const itemOptionExists = await ProductOptionItem.findOne({
          where: { option_name: newItemData.option_name },
        });

        if (!itemOptionExists) {
          await ProductOptionItem.create({
            option_name: newItemData.option_name,
          });
          console.log(`ProductOptionItem inserted: ${newItemData.option_name}`);
        }

        try {
          await Item.create(newItemData);
          console.log("Item inserted: ", newItemData.item_id);
        } catch (error) {
          console.error("Error inserting item: ", error);
        }
      } else {
        console.log(`Item already exists, skipping: ${newItemData.item_id}`);
      }
    }
  } catch (error) {
    console.error("Error inserting product order details: ", error);
  }
}

async function handleTestFetch() {
  try {
    const flattenedDetails = await fetchAndProcessOrders();
    if (flattenedDetails.length === 0) {
      return "주문 목록이 없습니다.";
    }

    // await writeToSpreadsheet(
    //   { orders: flattenedDetails },
    //   process.env.NAVER_SHEET_NAME,
    //   "naver"
    // );
    return "구글 스프레드시트에 주문 정보를 업데이트했습니다.";
  } catch (error) {
    // 에러 처리는 호출하는 측에서 합니다.
    throw error;
  }
}

module.exports = {
  handleTestFetch,
  insertProductOrderDetails,
};
