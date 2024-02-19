module.exports = (sequelize, DataTypes) => {
  const OriginProduct = sequelize.define(
    "OriginProduct",
    {
      origin_product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      원제품명: DataTypes.STRING,
    },
    {
      tableName: "OriginProducts",
      timestamps: false,
    }
  );

  return OriginProduct;
};
