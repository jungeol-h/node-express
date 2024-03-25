const {
  fetchAuthToken,
  fetchLastChangedProductOrders,
  fetchProductOrderDetails,
} = require("../api/naver/naverApi");
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
  // Assuming `details` is an array of objects, each with a `data` field that contains the actual details
  return details.flatMap((detail) =>
    detail.data.map((d) => ({
      ...d.productOrder,
      ...d.delivery,
      ...d.order,
    }))
  );
}

async function fetchAndProcessOrders(lastChangedFromInput) {
  const authToken = await fetchAuthToken();

  lastChangedFrom = new Date(lastChangedFromInput);
  //테스트로 2월 29일 00시, KSTdate 를 lastChangedFrom으로 설정
  // const lastChangedFrom = new Date("2024-02-28T00:00:00Z");
  // lastChangedFrom.setHours(lastChangedFrom.getHours() + 9);
  console.log("📆 lastChangedFrom : ", lastChangedFrom.toISOString());
  // const lastChangedTo = getKSTDate(0, 10);
  // console.log("lastChangedTo : ", lastChangedTo);

  const changedOrdersData = await fetchLastChangedProductOrders(
    authToken.access_token,
    lastChangedFrom.toISOString()
    // lastChangedTo
  );
  // console.log("changedOrdersData : ", changedOrdersData);

  if (!changedOrdersData || changedOrdersData.length === 0) {
    return [];
  }

  const productOrderIds = changedOrdersData.map(
    (status) => status.productOrderId
  );
  // console.log("productOrderIds : ", productOrderIds);
  const details = await fetchProductOrderDetails(
    authToken.access_token,
    productOrderIds
  );
  // console.log(
  //   "details : ",
  //   JSON.stringify(flattenDetailsData(details), null, 2)
  // );
  return flattenDetailsData(details);
}

async function insertProductOrderDetails(lastChangedFromInput) {
  try {
    const allOrders = await fetchAndProcessOrders(lastChangedFromInput);
    // console.log("allOrders[0] : ");
    // console.log(allOrders[0]);
    for (const order of allOrders) {
      // 주문 정보 삽입
      const orderExists = await Order.findOne({
        where: { order_id: order.orderId },
      });
      if (!orderExists) {
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(orderDate.getHours() + 9); // Adding 9 hours to consider UST KST time difference
        await Order.create({
          order_id: order.orderId,
          shop_num: 4,
          payment_amount: order.totalPaymentAmount,
          order_date: orderDate,
          order_name: order.ordererName,
          shipping_fee: order.deliveryFeeAmount,
          // 다른 주문 관련 필드...
        });
        // console.log(
        //   `Order inserted: ${order.orderId} order_date: ${order.orderDate}`
        // );
      } else {
        // console.log(`Order already exists, skipping: ${order.orderId}`);
      }

      const processedOptionName = cleanOptionName(order.productOption || "");
      discount_price_per_item = order.productDiscountAmount / order.quantity;
      actual_item_price =
        parseInt(order.unitPrice) - parseInt(discount_price_per_item);

      const newItemData = {
        item_id: order.productOrderId,
        order_id: order.orderId,
        merchandise_name: order.productName,
        option_name: processedOptionName,
        item_price: actual_item_price,
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
            option_price: 0,
          });
          newItemData.option_id = createdOption.option_id;
          // console.log(`Option inserted: ${createdOption.option_name}`);
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
          // console.log(`ProductOption inserted: ${newItemData.option_id}`);
        }

        try {
          await Item.create(newItemData);
          // console.log("Item inserted: ", newItemData.item_id);
        } catch (error) {
          console.error("Error inserting item: ", error);
        }
      } else {
        // console.log(`Item already exists, skipping: ${newItemData.item_id}`);
      }
    }
  } catch (error) {
    console.error("Error inserting product order details: ", error);
  }
}

module.exports = {
  insertProductOrderDetails,
};
