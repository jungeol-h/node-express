module.exports = (sequelize, DataTypes) => {
  const ItemOption = sequelize.define(
    "ItemOption",
    {
      option_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      item_id: DataTypes.INTEGER,
      option_name: DataTypes.STRING,
      option_price: DataTypes.DECIMAL,
    },
    {
      tableName: "ItemOptions",
      timestamps: false,
    }
  );

  ItemOption.associate = function (models) {
    ItemOption.belongsTo(models.Item, { foreignKey: "item_id" });
  };

  return ItemOption;
};
