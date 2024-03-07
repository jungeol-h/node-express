// services/coupangServices.js
const xlsx = require("xlsx");
const fs = require("fs");
const { Order } = require("../models").sequelize.models;
const { Item } = require("../models").sequelize.models;
const { Option } = require("../models").sequelize.models;
const { ProductOption } = require("../models").sequelize.models;
const { cleanOptionName } = require("../utils/optionProcessing");

async function insertAllOrders(allOrders) {
  try {
    for (const order of allOrders) {
      const orderExists = await Order.findOne({
        where: { order_id: order.order_id },
      });

      if (!orderExists) {
        const newOrderData = {
          order_id: order.order_id,
          shop_num: 3,
          payment_amount: parseFloat(order.price),
          order_date: new Date(order.order_date),
          shipping_type: order.shipping_type,
        };
        try {
          await Order.create(newOrderData);
          console.log("Order inserted: ", newOrderData.order_id);
        } catch (error) {
          console.error("Error inserting order: ", error);
        }
      } else {
        console.log("Order already exists, skipping insert: ", order.order_id);
      }

      const processedOptionName = cleanOptionName(order.option_name);

      const newItemData = {
        item_id: order.item_id,
        order_id: order.order_id,
        merchandise_name: order.merchandise_id,
        option_name: processedOptionName,
        item_price: parseFloat(order.price),
        item_count: order.quantity,
      };
      const itemExists = await Item.findOne({
        where: { item_id: newItemData.item_id },
      });

      if (!itemExists) {
        const optionExists = await Option.findOne({
          where: { option_name: newItemData.option_name },
        });

        if (!optionExists) {
          createdOption = await Option.create({
            option_name: newItemData.option_name,
            option_price: order.option_price,
          });
          newItemData.option_id = createdOption.option_id;
          console.log("Option inserted: ", createdOption.option_name);
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
          console.log("ProductOption inserted: ", newItemData.option_id);
        }

        try {
          await Item.create(newItemData);
          console.log("Item inserted: ", newItemData.item_id);
        } catch (error) {
          console.error("Error inserting item: ", error);
        }
      } else {
        console.log(
          "Item already exists, skipping insert: ",
          newItemData.item_id
        );
      }
    }
  } catch (error) {
    console.error("Error inserting order: ", error);
  }
}

const processCoupangFile = (filePath, fileName) => {
  const datePattern = /(\d{4})(\d{2})(\d{2})~/;
  const match = fileName.match(datePattern);
  if (!match) {
    return res.status(400).send("파일 이름에서 날짜를 추출할 수 없습니다.");
  }
  const orderDateStr = `${match[1]}-${match[2]}-${match[3]}`; // '20240220'
  const orderDate = new Date(orderDateStr);
  console.log("orderDate: ", orderDate);

  // 파일 읽기 및 데이터 변환
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(sheet);

  // 주문 데이터로 분해 및 가격 할당
  let orders = [];
  rawData.forEach((item, index) => {
    if (item["노출상품ID"] !== "합 계") {
      let unitPrice =
        item["순 판매 금액(전체 거래 금액 - 취소 금액)"] /
        item["순 판매 상품 수(전체 거래 상품 수 - 취소 상품 수)"]; // 개별 주문의 가격 계산
      for (
        let i = 0;
        i < item["순 판매 상품 수(전체 거래 상품 수 - 취소 상품 수)"];
        i++
      ) {
        let orderId = `${orderDateStr}-${item["옵션ID"]}-${i + 1}`;
        let itemId = `${orderDateStr}-${item["옵션ID"]}-${i + 1}-1`;
        let order = {
          order_id: orderId,
          item_id: itemId,
          merchandise_id: item["노출상품ID"],
          option_id: item["옵션ID"],
          option_name: item["옵션명"],
          shipping_type: item["상품타입"],
          category: item["카테고리"],
          order_date: orderDate,
          price: unitPrice, // 여기에 개별 주문의 가격 할당
          quantity: 1, // 개별 주문 단위 수량
        };
        orders.push(order);
      }
    }
  });
  fs.unlinkSync(filePath); // 임시 파일 삭제
  insertAllOrders(orders);

  return orders;
};

module.exports = { processCoupangFile };
