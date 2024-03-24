function cleanOptionName(optionName) {
  // Define prefixes to remove
  const prefixesToRemove = [
    "상품선택=",
    "상품선택:",
    "상품 선택:",
    "상품 선택=",
    "세트할인=",
    "세트선택=",
    "세트 선택=",
    "세트 선택:",
    "[무료배송]",
    "[무료배송/1팩무료]",
    "[무료배송/1팩 무료]",
    "[무료배송/이벤트]",
    "톡투허 베스트셀러 1위=",
    "[1개 무료]",
    "세트할인:",
    "세트선택:",
    "3+1 EVENT:",
    "3+1 EVENT=",
    "유통기한 임박 상품 할인:",
    "유통기한 임박 상품 할인=",
    "상큼한 맛이 필요할 때:",
    "상큼한 맛이 필요할 때=",
    "새로 나온 루이보스티:",
    "추가구매:",
    "추가구매=",
    "톡투허 베스트셀러 1위:",
    "[1박스 무료]",
    "옵션선택:",
    "옵션선택=",
    "겨울에도 시원한 호박팥차:",
    "겨울에도 시원한 호박팥차=",
    "할인구매:",
    "할인구매=",
    "대용량 특가 상품 선택:",
    "대용량 특가 상품 선택=",
  ];

  // Remove each prefix found in the optionName
  let cleanedOptionName = optionName;
  prefixesToRemove.forEach((prefix) => {
    cleanedOptionName = cleanedOptionName.replace(prefix, "");
  });

  // Remove nn% discount pattern
  cleanedOptionName = cleanedOptionName.replace(/\(\d{2}%할인\)/g, "");

  // Replace '개' with '팩'
  cleanedOptionName = cleanedOptionName.replace(/팩/g, "개");
  cleanedOptionName = cleanedOptionName.replace(/박스/g, "개");

  // Trim leading and trailing spaces and replace '=' with ':'
  cleanedOptionName = cleanedOptionName.trim().replace("=", ":");

  //함수 deprecated되어 인자 그대로 반환중
  return optionName;
}

module.exports = {
  cleanOptionName,
};
