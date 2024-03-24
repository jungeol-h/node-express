const { Product } = require("../models").sequelize.models;

async function convertProductIdToProductName(productStatistics) {
  let modifiedStatistics = {};
  try {
    // Products 모델에서 모든 제품 조회하여 ID와 이름 매핑 정보 생성
    const products = await Product.findAll();
    const productIdToNameMap = products.reduce((acc, product) => {
      acc[product.product_id] = product.product_name;
      return acc;
    }, {});
    // 판매 채널 매핑 정보
    const salesChannelMap = {
      1: "홈페이지",
      2: "네이버",
      3: "쿠팡",
      4: "스마트",
    };

    // productStatistics 객체 순회하며 제품명을 키로 사용하는 새로운 객체 생성
    // productStatistics 객체 순회하며 제품명과 판매 채널 모두 변환
    Object.keys(productStatistics).forEach((productId) => {
      const productName = productIdToNameMap[productId];
      modifiedStatistics[productName] = { ...productStatistics[productId] };
      // sales 객체 내의 채널 이름 변환
      modifiedStatistics[productName].sales = Object.keys(
        modifiedStatistics[productName].sales
      ).reduce((acc, channel) => {
        acc[salesChannelMap[channel]] =
          modifiedStatistics[productName].sales[channel];
        return acc;
      }, {});
    });

    return modifiedStatistics;
  } catch (error) {
    console.error("Error converting product IDs to names:", error);
    throw error;
  }
}

module.exports = {
  convertProductIdToProductName,
};
