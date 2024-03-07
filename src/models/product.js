module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_name: {
        type: DataTypes.STRING,
      },
      product_price: DataTypes.DECIMAL,
      product_original_price: DataTypes.DECIMAL,
      // 여기에 추가적인 필드를 정의할 수 있습니다.
    },
    {
      tableName: "Products",
      timestamps: false,
    }
  );

  Product.associate = function (models) {
    Product.hasMany(models.ProductOption, { foreignKey: "product_id" });
  };
  return Product;
};
