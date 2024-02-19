const Order = require("../models/order");

// 주문 데이터 삽입
const createOrder = async (orderData) => {
  try {
    const order = await Order.create(orderData);
    return order;
  } catch (error) {
    // 에러 처리 로직
    throw error;
  }
};

// 기타 필요한 서비스 함수 정의

module.exports = {
  createOrder,
};
