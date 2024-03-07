const {
  fetchAuthToken,
  fetchLastChangedProductOrders,
  fetchProductOrderDetails,
} = require("../api/naver/naverApi");
const { writeToSpreadsheet } = require("../utils/spreadsheet");
const { Order } = require("../models").sequelize.models;
const { Item } = require("../models").sequelize.models;
const { Option } = require("../models").sequelize.models;
const { ProductOption } = require("../models").sequelize.models;
const { cleanOptionName } = require("../utils/optionProcessing");

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
  const lastChangedFrom = getKSTDate(1);
  console.log("lastChangedFrom : ", lastChangedFrom);
  const lastChangedTo = getKSTDate(0, 10);
  console.log("lastChangedTo : ", lastChangedTo);

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

      const processedOptionName = cleanOptionName(order.productOption);

      const newItemData = {
        item_id: order.productOrderId,
        order_id: order.orderId,
        merchandise_name: order.productName,
        option_name: processedOptionName,
        item_price: order.unitPrice,
        item_count: order.quantity,
      };
      //option_name이 없으면 option_name을 merchandise_name으로 설정
      if (!newItemData.option_name) {
        newItemData.option_name = newItemData.merchandise_name;
      }
      const itemExists = await Item.findOne({
        // 아이템이 이미 존재하는지 확인
        where: { item_id: newItemData.item_id },
      });
      if (!itemExists) {
        // 아이템이 존재하지 않으면 삽입
        const optionExists = await Option.findOne({
          where: { option_name: newItemData.option_name },
        });

        if (!optionExists) {
          // 옵션이 존재하지 않으면 삽입
          createdOption = await Option.create({
            option_name: newItemData.option_name,
            option_price: order.optionPrice,
          });
          newItemData.option_id = createdOption.option_id;
          console.log(`Option inserted: ${createdOption.option_name}`);
        } else {
          newItemData.option_id = optionExists.option_id;
        }

        const productOptionExists = await ProductOption.findOne({
          where: { option_id: newItemData.option_id },
        });

        if (!productOptionExists) {
          await ProductOption.create({
            option_id: newItemData.option_id,
          });
          console.log(`ProductOption inserted: ${newItemData.option_id}`);
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
