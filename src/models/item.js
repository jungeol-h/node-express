module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    "Item",
    {
      item_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      merchandise_name: DataTypes.STRING,
      option_id: {
        type: DataTypes.INTEGER,
      },
      item_price: DataTypes.DECIMAL,
      item_count: DataTypes.INTEGER,
      // 다른 필드들도 여기에 정의합니다.
    },
    {
      tableName: "Items",
      timestamps: false,
    }
  );

  Item.associate = function (models) {
    Item.belongsTo(models.Order, { foreignKey: "order_id" });
    Item.belongsTo(models.Option, { foreignKey: "option_id" });
  };

  return Item;
};
