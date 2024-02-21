module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      product_name: {
        type: DataTypes.STRING,
        primaryKey: true,
      },

      // 여기에 추가적인 필드를 정의할 수 있습니다.
    },
    {
      tableName: "Products",
      timestamps: false,
    }
  );

  Product.associate = function (models) {
    Product.hasMany(models.ProductOptionItem, { foreignKey: "product_name" });
  };
  return Product;
};
