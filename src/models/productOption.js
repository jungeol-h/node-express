module.exports = (sequelize, DataTypes) => {
  const ProductOption = sequelize.define(
    "ProductOption",
    {
      product_option_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      option_id: {
        type: DataTypes.INTEGER,
      },
      product_count: DataTypes.INTEGER,
      product_1month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      product_2month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      product_3month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "ProductOptions",
      timestamps: false,
    }
  );
  ProductOption.associate = function (models) {
    ProductOption.belongsTo(models.Option, { foreignKey: "option_id" });
    ProductOption.belongsTo(models.Product, { foreignKey: "product_id" });
  };
  return ProductOption;
};
