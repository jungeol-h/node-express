const express = require("express");
const router = express.Router();
const statService = require("../services/statService");

// Route to get the total payment amount
router.get("/total-payment-amount", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const totalPaymentAmount = await statService.getTotalPaymentAmount(days);
    res.json({
      success: true,
      message: "Total payment amount retrieved successfully",
      data: {
        totalPaymentAmount,
      },
    });
  } catch (error) {
    console.error("Error in /total-payment-amount route", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the total payment amount",
    });
  }
});

router.get("/total-payment-amount-by-date", async (req, res) => {
  try {
    // 쿼리 파라미터에서 'days' 값을 읽음. 기본값은 7일.
    const days = parseInt(req.query.days) || 7;

    // 수정된 getTotalPaymentAmountByDate 함수에 'days' 인자를 전달
    const totalPaymentAmountByDate =
      await statService.getTotalPaymentAmountByDate(days);
    res.json({
      success: true,
      message: "Total payment amount by date retrieved successfully",
      data: {
        totalPaymentAmountByDate,
      },
    });
  } catch (error) {
    console.error("Error in /total-payment-amount-by-date route", error);
    res.status(500).json({
      success: false,
      message:
        "An error occurred while retrieving the total payment amount by date",
    });
  }
});

// Route to get sales data by product
router.get("/sales-by-product", async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 7; // Default to 7 days if not specified
    const salesDataByProduct = await statService.getSalesDataByProduct(period);
    res.json({
      success: true,
      message: "Sales data by product retrieved successfully",
      data: {
        salesByProduct: salesDataByProduct,
      },
    });
  } catch (error) {
    console.error("Error in /sales-by-product route", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving sales data by product",
    });
  }
});

router.get("/test", async (req, res) => {
  try {
    const test = await statService.updateProductStatistics();
    res.json({
      success: true,
      message: "test",
      data: {
        test,
      },
    });
  } catch (error) {
    console.error("Error in /test route", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving test",
    });
  }
});
module.exports = router;
