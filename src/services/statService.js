const { Order, sequelize, Sequelize } = require("../models"); // Adjust the path as necessary
const { Op } = Sequelize;

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
  getMonthCountbyProduct: async () => {},
};

module.exports = statService;
