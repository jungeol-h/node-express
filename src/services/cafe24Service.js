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
const { Order } = require("../models").sequelize.models;
const { Item } = require("../models").sequelize.models;
const { Option } = require("../models").sequelize.models;
const { ProductOption } = require("../models").sequelize.models;
const { cleanOptionName } = require("../utils/optionProcessing");

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

async function insertAllOrders(allOrders) {
  try {
    for (const order of allOrders) {
      const orderExists = await Order.findOne({
        where: { order_id: order.order_id },
      });

      if (!orderExists) {
        // console.log("order_date: " + order.order_date);
        const orderDate = new Date(order.order_date);
        orderDate.setHours(orderDate.getHours() + 9); // Adding 9 hours to consider UST KST time difference
        const newOrderData = {
          order_id: order.order_id,
          shop_num: order.order_place_id === "NCEHECKOUT" ? 2 : 1,
          payment_amount: parseFloat(order.payment_amount),
          order_date: orderDate,
          order_name: order.billing_name,
          shipping_fee: parseFloat(order.initial_order_amount.shipping_fee),
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

      for (const item of order.items) {
        if (item.option_value === "") {
          item.option_value = item.product_name;
        }
        const processedOptionName = cleanOptionName(item.option_value || "");
        discount_price_per_item =
          item.additional_discount_price / item.quantity;
        actual_item_price =
          parseInt(item.product_price) +
          parseInt(item.option_price) -
          parseInt(discount_price_per_item);

        const newItemData = {
          item_id: item.order_item_code,
          order_id: order.order_id,
          merchandise_name: item.product_name,
          option_name: processedOptionName,
          item_price: actual_item_price,
          item_count: item.quantity,
        };

        // Check if the item already exists to avoid duplicate entry error
        const itemExists = await Item.findOne({
          where: { item_id: newItemData.item_id },
        });

        if (!itemExists) {
          // Check if Option exists
          const optionExists = await Option.findOne({
            where: { option_name: newItemData.option_name },
          });

          if (!optionExists) {
            createdOption = await Option.create({
              option_name: newItemData.option_name,
              option_price: 0,
            });
            newItemData.option_id = createdOption.option_id;
            // console.log("Option inserted: ", createdOption.option_name);
          } else {
            newItemData.option_id = optionExists.option_id;
          }

          const productOptionExists = await ProductOption.findOne({
            where: {
              option_id: newItemData.option_id,
            },
          });

          if (!productOptionExists) {
            await ProductOption.create({
              option_id: newItemData.option_id,
              // Additional data like option_price can be added here...
            });
            // console.log("ProductOptions inserted: ", newItemData.option_id);
          }

          try {
            await Item.create(newItemData);
            // console.log(
            //   "Item inserted for order ",
            //   order.order_id,
            //   ": ",
            //   item.order_item_code
            // );
          } catch (error) {
            console.error("Error inserting item: ", error);
          }
        } else {
          console.log(
            `Item with ID ${newItemData.item_id} already exists. Skipping insert.`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error processing orders and items: ", error);
  }
}

async function updateSpreadsheets(accessToken) {
  try {
    // const { startDate, endDate } = getDateRange(1);
    //startDate, endDate를 테스트 용도로 2024-02-29, 2024-02-29로 고정
    const startDate = "2024-02-29";
    const endDate = "2024-02-29";
    const totalOrders = await fetchOrdersCount(accessToken, startDate, endDate);
    const allOrders = await fetchAllOrders(
      accessToken,
      startDate,
      endDate,
      totalOrders
    );
    await insertAllOrders(allOrders);

    // await writeToSpreadsheet(
    //   {
    //     orders: allOrders,
    //   },
    //   process.env.CAFE24_SHEET_NAME,
    //   "cafe24"
    // );

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
