const moment = require("moment-timezone");
const {
  Order,
  Product,
  Item,
  Option,
  ProductOption,
  sequelize,
  Sequelize,
} = require("../models"); // Adjust the path as necessary
const { Op } = Sequelize;
const {
  convertProductIdToProductName,
} = require("../utils/convertProductIdToProductName");
const logger = require("../../logger");

const statService = {
  getTotalPaymentAmount: async (days = 1) => {
    try {
      // 현재 날짜와 시작 날짜를 설정
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // 지정된 기간 동안의 총 결제 금액을 계산
      const total = await Order.sum("payment_amount", {
        where: {
          order_date: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      return total;
    } catch (error) {
      console.error("Error getting total payment amount:", error);
      throw error;
    }
  },
  getTotalPaymentAmountByDate: async (days = 7) => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      // 인자로 받은 일 수에 따라 startDate 설정
      startDate.setDate(endDate.getDate() - days);

      const dailyPayments = await Order.findAll({
        attributes: [
          [sequelize.fn("date", sequelize.col("order_date")), "date"],
          [sequelize.col("shop_num"), "shop_num"],
          [
            sequelize.fn("SUM", sequelize.col("payment_amount")),
            "total_payment",
          ],
        ],
        where: {
          order_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [sequelize.fn("date", sequelize.col("order_date")), "shop_num"],
        order: [
          [sequelize.fn("date", sequelize.col("order_date")), "ASC"],
          ["shop_num", "ASC"],
        ],
      });

      // 모든 날짜 및 샵 번호의 조합을 생성
      const allDatesAndShops = {};
      const shopNumbers = [1, 2, 3]; // 가정: 현재 샵 번호는 1, 2, 3
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
        shopNumbers.forEach((shopNum) => {
          if (!allDatesAndShops[dateString]) {
            allDatesAndShops[dateString] = {};
          }
          allDatesAndShops[dateString][shopNum] = 0; // 초기 매출 합을 0으로 설정
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 집계된 데이터를 이용해 매출 합 업데이트
      dailyPayments.forEach((payment) => {
        const { date, shop_num, total_payment } = payment.dataValues;
        if (
          allDatesAndShops[date] &&
          allDatesAndShops[date][shop_num] !== undefined
        ) {
          allDatesAndShops[date][shop_num] = parseFloat(total_payment);
        }
      });

      // 결과 변환
      const result = Object.keys(allDatesAndShops).map((date) => ({
        date,
        total_payment: Object.values(allDatesAndShops[date]).reduce(
          (acc, current) => acc + current,
          0
        ),
        shops: Object.keys(allDatesAndShops[date]).map((shopNum) => ({
          shop_num: parseInt(shopNum),
          total_payment: allDatesAndShops[date][shopNum],
        })),
      }));

      return result;
    } catch (error) {
      console.error("Error getting daily payment amounts by date:", error);
      throw error;
    }
  },
  getSalesDataByProduct: async (days = 7) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    try {
      const salesData = await sequelize.query(
        `
        SELECT
          DATE(o.order_date) AS sales_date,
          p.product_id,
          p.product_name,
          SUM(p.product_price * po.product_count * i.item_count) AS total_sales
        FROM
          Orders o
          JOIN Items i ON o.order_id = i.order_id
          JOIN Options opt ON i.option_id = opt.option_id
          JOIN ProductOptions po ON opt.option_id = po.option_id
          JOIN Products p ON po.product_id = p.product_id
        WHERE
          o.order_date BETWEEN :startDate AND :endDate
        GROUP BY
          DATE(o.order_date), p.product_id, p.product_name
        ORDER BY
          sales_date ASC, total_sales DESC
        `,
        {
          replacements: { startDate, endDate },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      // 날짜별로 데이터를 그룹화하는 로직
      const groupedData = salesData.reduce((acc, cur) => {
        // 현재 날짜를 키로 사용하여 그룹화
        const date = cur.sales_date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          product_id: cur.product_id,
          product_name: cur.product_name,
          total_sales: cur.total_sales,
        });
        return acc;
      }, {});

      // 최종 결과를 날짜별 배열로 변환
      const result = Object.keys(groupedData).map((date) => ({
        sales_date: date,
        products: groupedData[date],
      }));

      return result;
    } catch (error) {
      console.error("Error getting sales data by product:", error);
      throw error;
    }
  },
  // 제품별 통계 객체 초기화 함수
  initializeProductStatistics: async () => {
    let productStatistics = {};

    try {
      // Products 모델에서 모든 제품 조회
      const products = await Product.findAll();

      // 각 제품별로 통계 객체 초기화
      products.forEach((product) => {
        productStatistics[product.product_id] = {
          product: {
            "1month": 0,
            "2month": 0,
            "3month": 0,
          },
          shipping: {
            count: 0,
            shipping_fee_customer: 0,
          },
          sales: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
          },
          coupang: {
            seller: 0,
            rocket: 0,
          },
        };
      });

      return productStatistics; // 초기화된 통계 객체 반환
    } catch (error) {
      console.error("Error initializing product statistics:", error);
      throw error;
    }
  },
  // 제품별 통계 업데이트 함수
  updateProductStatistics: async (dateString) => {
    try {
      console.log("🤖 제품 통계 작업 시작");
      // const dateString = "2024-02-29";
      //통계 객체 초기화
      productStatistics = await statService.initializeProductStatistics();
      // console.log("productStatistics", productStatistics);
      const startDate = new Date(dateString);
      const endDate = new Date(dateString);

      endDate.setHours(23, 59, 59, 999); // 23:59:59.999로 설정

      //모든 주문 불러오기
      // const orderIds = ["20240307-0000387"]; // Specify the IDs you want to retrieve

      const orders = await Order.findAll({
        where: {
          order_date: {
            [Op.gte]: startDate,
            [Op.lte]: endDate, // '<=' 연산자를 사용하여 endDate가 해당 날짜의 마지막 순간을 포함하도록 합니다.
          },
        },
        include: [
          {
            model: Item,
            include: [
              {
                model: Option,
                include: [ProductOption],
              },
            ],
          },
        ],
        // limit: 1, // Limit the number of orders to 2
      });

      //각 주문 순회
      orders.forEach((order) => {
        let productGroupsCount = new Set();
        console.log(
          `⬛️ 주문 ${order.order_id} || 채널 ${order.shop_num} || 결제금 ${order.payment_amount}`
        );
        // logger.info(
        //   `⬛️ 주문 ${order.order_id} || 채널 ${order.shop_num} || 결제금 ${order.payment_amount}`
        // );

        // 각 아이템의 제품군수 계산
        order.Items.forEach((item) => {
          console.log(
            `  ⏺ ${item.item_id} - ${item.Option.option_name} || 옵션가: ${item.item_price} || 옵션ID: ${item.Option.option_id}`
          );

          item.Option.ProductOptions.forEach((productOption) => {
            productGroupsCount.add(productOption.product_id); // 제품 ID를 Set에 추가
          });
        });
        // console.log("주문에 포함된 제품군수: " + productGroupsCount.size);
        //제품 군수에 따라 로직 분기

        //1️⃣ 한 종류의 제품만 주문한 경우
        if (productGroupsCount.size === 1) {
          // console.log("1️⃣ 한 종류의 제품만 주문한 경우");
          //1. 제품 통계 업데이트
          order.Items.forEach((item) => {
            const productOption = item.Option.ProductOptions[0];
            const product = productOption.product_id;
            const month_1 = productOption.product_1month * item.item_count || 0;
            const month_2 = productOption.product_2month * item.item_count || 0;
            const month_3 = productOption.product_3month * item.item_count || 0;
            productStatistics[product].product["1month"] += parseInt(month_1);
            productStatistics[product].product["2month"] += parseInt(month_2);
            productStatistics[product].product["3month"] += parseInt(month_3);
          });
          //2. 배송 통계 업데이트
          //2-1. 판매 건수 업데이트
          const product = order.Items[0].Option.ProductOptions[0].product_id;
          productStatistics[product].shipping.count += 1;

          //2-2. 배송 고객 업데이트
          if (order.payment_amount < 25000 && order.shop_num !== 3) {
            productStatistics[product].shipping.shipping_fee_customer += 3000;
            process.stdout.write(`  📦 제품 ${product}  배송비: 3000`);
          }
          //2-3. 쿠팡만 특수 케이스 처리
          if (order.shop_num === 3) {
            // console.log(order.Items[0].Option.option_price);
            if (order.Items[0].Option.option_price == 3000) {
              productStatistics[product].shipping.shipping_fee_customer += 3000;
              productStatistics[product].coupang.seller += 1;
              process.stdout.write(`  📦 쿠팡 배송비: 3000`);
            } else {
              productStatistics[product].shipping.shipping_fee_customer -= 1250;
              productStatistics[product].coupang.rocket += 1;
              process.stdout.write(`  📦 쿠팡 배송비: -1250`);
            }
          }

          //3. 매출 통계 업데이트
          //주문 정보 내 채널id 읽고 , 그 채널에 ITEM 테이블 item_price를 statistic에 추가
          const shop = order.shop_num;
          // productStatistics[product].sales[shop] += order.payment_amount;
          order.Items.forEach((item) => {
            const product = item.Option.ProductOptions[0].product_id;
            // console.log(`제품: ${product}`);
            const price = parseInt(item.item_price) * item.item_count;
            productStatistics[product].sales[shop] += price;
            console.log(`  💵 제품 ${product} 매출 +${price}`);
          });
        } //🔥 두 종류 이상의 제품을 주문한 경우
        else if (productGroupsCount.size >= 2) {
          // console.log("2️⃣ 두 종류 이상의 제품을 주문한 경우");
          //1. 제품 통계 업데이트
          //option에 있는 ProductOptions를 통해 포함된 제품들을 확인하고, 각각 productStatistics에 업데이트
          order.Items.forEach((item) => {
            item.Option.ProductOptions.forEach((productOption) => {
              const product = productOption.product_id;
              const month_1 =
                productOption.product_1month * item.item_count || 0;
              const month_2 =
                productOption.product_2month * item.item_count || 0;
              const month_3 =
                productOption.product_3month * item.item_count || 0;
              // console.log(
              //   `🔸 제품: ${product} 1개월치: ${month_1} 2개월치: ${month_2} 3개월치: ${month_3}`
              // );
              productStatistics[product].product["1month"] += month_1;
              productStatistics[product].product["2month"] += month_2;
              productStatistics[product].product["3month"] += month_3;
            });
          });

          //2. 배송 통계 업데이트
          //2-1 판매 건수 업데이트
          //order에 포함된 제품군수만큼 추가하는 방식
          order.Items.forEach((item) => {
            item.Option.ProductOptions.forEach((productOption) => {
              const product = productOption.product_id;
              // console.log(`제품: ${product}`);

              productStatistics[product].shipping.count += 1;
            });
          });

          //2-2 배송비_고객 업데이트
          let shippingFeePerProduct;
          switch (productGroupsCount.size) {
            case 2:
              shippingFeePerProduct = 1400;
              break;
            case 3:
              shippingFeePerProduct = 1800;
              break;
            case 4:
              shippingFeePerProduct = 2100;
              break;
            default:
              shippingFeePerProduct = 3000; // 기본값 또는 예외 상황 처리
              break;
          }

          if (order.payment_amount < 25000) {
            order.Items.forEach((item) => {
              item.Option.ProductOptions.forEach((productOption) => {
                const product = productOption.product_id;
                // 여기서 각 제품에 대한 배송비를 추가합니다.
                productStatistics[product].shipping.shipping_fee_customer +=
                  parseInt(shippingFeePerProduct);
                process.stdout.write(
                  `  📦 제품 ${product}배송비 +${shippingFeePerProduct}`
                );
              });
            });
          }

          //3. 매출 통계 업데이트
          const shop = order.shop_num;
          order.Items.forEach((item) => {
            if (item.Option.ProductOptions.length > 1) {
              // 한 옵션에 여러 제품 옵션이 있는 경우
              const itemTotalWeight = item.Option.ProductOptions.reduce(
                (sum, productOption) => {
                  const month_1 = productOption.product_1month || 0;
                  const month_2 = productOption.product_2month || 0;
                  const month_3 = productOption.product_3month || 0;
                  return sum + month_1 + month_2 * 2 + month_3 * 3; // 해당 아이템의 총 가중치 계산
                },
                0
              );

              item.Option.ProductOptions.forEach((productOption) => {
                const product = productOption.product_id;
                const month_1 = productOption.product_1month || 0;
                const month_2 = productOption.product_2month || 0;
                const month_3 = productOption.product_3month || 0;
                const productWeight = month_1 + month_2 * 2 + month_3 * 3; // 개별 제품 옵션의 가중치
                const productShare = productWeight / itemTotalWeight; // 전체 가중치 대비 제품 옵션의 가중치 비율
                const price = parseInt(item.item_price) * productShare; // 아이템 가격에 비율 적용하여 매출에 추가
                productStatistics[product].sales[shop] +=
                  parseInt(price) * item.item_count;
                console.log(`  💵 제품: ${product} 매출 +${price}`);
              });
            } else {
              // 한 옵션에 단일 제품만 있는 경우, 이전 로직 그대로 처리
              const productOption = item.Option.ProductOptions[0];
              const product = productOption.product_id;
              const price = parseInt(item.item_price);
              productStatistics[product].sales[shop] += price * item.item_count;
              console.log(`  💵 제품: ${product} 매출 +${price}`);
            }
          });

          //기존
          // const shop = order.shop_num;
          // order.Items.forEach((item) => {
          //   //item에 포함된 제품 비율에 따라 매출 업데이트 해야 함 ex: item에 product_id가 1인 제품이 2개, product_id가 2인 제품이 1개인 경우 item.item_price를 2:1로 productStatistics[product].sales[shop] 업데이트
          //   //제품 개수는 productOption에 1month, 2month, 3month에 저장되어 있음. 2month는 2를 곱해야 하고, 3month는 3을 곱해야 함

          //   const product = item.Option.ProductOptions[0].product_id;
          //   const price = parseInt(item.item_price);
          //   productStatistics[product].sales[shop] += price;
          //   console.log(`매출 추가: ${price}`);
          // });
        }
      });
      //4. 통계 객체 반환
      // console.log("✅ 전체 통계 객체 반환");
      productStatistics = convertProductIdToProductName(productStatistics);
      return productStatistics;
    } catch (error) {
      console.error("Error calculating order statistics:", error);
      throw error;
    }
  },
};

module.exports = statService;
