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
const { ItemOption } = require("../models").sequelize.models;
const { ProductOptionItem } = require("../models").sequelize.models;

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
        const newOrderData = {
          order_id: order.order_id,
          shop_num: 1, // Assuming this is static or extracted as needed
          payment_amount: parseFloat(order.payment_amount),
          order_date: new Date(order.order_date),
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
        const newItemData = {
          item_id: item.order_item_code,
          order_id: order.order_id,
          merchandise_name: item.product_name,
          option_name: item.option_value.replace(/=/g, ": "),
          item_price: parseFloat(item.product_price),
          item_count: item.quantity,
        };

        // Check if the item already exists to avoid duplicate entry error
        const itemExists = await Item.findOne({
          where: { item_id: newItemData.item_id },
        });

        if (!itemExists) {
          // Check if ItemOption exists
          const optionExists = await ItemOption.findOne({
            where: { option_name: newItemData.option_name },
          });

          if (!optionExists) {
            await ItemOption.create({
              option_name: newItemData.option_name,
              option_price: item.option_price,
            });
            console.log("ItemOption inserted: ", newItemData.option_name);
          }

          const itemOptionExists = await ProductOptionItem.findOne({
            where: {
              option_name: newItemData.option_name,
            },
          });

          if (!itemOptionExists) {
            await ProductOptionItem.create({
              option_name: newItemData.option_name,
              // Additional data like option_price can be added here...
            });
            console.log(
              "ProductOptionItems inserted: ",
              newItemData.option_name
            );
          }

          try {
            await Item.create(newItemData);
            console.log(
              "Item inserted for order ",
              order.order_id,
              ": ",
              item.order_item_code
            );
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
    const { startDate, endDate } = getDateRange(7); // 7일 전 날짜부터 오늘까지
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
