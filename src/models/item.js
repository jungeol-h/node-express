module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    "Item",
    {
      item_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      order_id: DataTypes.STRING,
      merchandise_name: DataTypes.STRING,
      option_name: {
        type: DataTypes.STRING,
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
    Item.belongsTo(models.ItemOption, { foreignKey: "option_name" });
  };

  return Item;
};
