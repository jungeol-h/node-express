module.exports = (sequelize, DataTypes) => {
  const ProductOptionItem = sequelize.define(
    "ProductOptionItem",
    {
      option_item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      option_name: {
        type: DataTypes.STRING,
        references: {
          model: "ItemOptions", // 'ProductOptions' 테이블을 참조
          key: "option_name", // 'ProductOptions'의 'option_id' 칼럼을 외래 키로 사용
        },
      },
      product_name: {
        type: DataTypes.STRING,
        references: {
          model: "Products", // 'Products' 테이블을 참조
          key: "product_name", // 'Products'의 'product_name' 칼럼을 외래 키로 사용
        },
      },
      product_count: DataTypes.INTEGER,
      // 다른 필드들도 여기에 정의합니다.
    },
    {
      tableName: "ProductOptionItems",
      timestamps: false,
    }
  );
  ProductOptionItem.associate = function (models) {
    ProductOptionItem.belongsTo(models.ItemOption, { foreignKey: "option_id" });
    ProductOptionItem.belongsTo(models.Product, { foreignKey: "product_name" });
  };
  return ProductOptionItem;
};
