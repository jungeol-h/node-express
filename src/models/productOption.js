module.exports = (sequelize, DataTypes) => {
  const ProductOptionItem = sequelize.define(
    "ProductOptionItem",
    {
      option_item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      option_id: DataTypes.STRING,
      product_id: DataTypes.INTEGER,
      product_count: DataTypes.INTEGER,
      // 다른 필드들도 여기에 정의합니다.
    },
    {
      tableName: "ProductOptionItems",
      timestamps: false,
    }
  );

  return ProductOptionItem;
};
