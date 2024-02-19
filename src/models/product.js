module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      product_name: DataTypes.STRING,
      // 여기에 추가적인 필드를 정의할 수 있습니다.
    },
    {
      tableName: "Products",
      timestamps: false,
    }
  );

  return Product;
};
