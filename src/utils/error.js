function handleError(res, error) {
  console.error("Error status:", error.response?.status || "No status");
  console.error("Error data:", error.response?.data || error.message);
  res.status(error.response?.status || 500).send("처리 중 에러 발생");
}

module.exports = { handleError };
