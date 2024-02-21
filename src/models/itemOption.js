module.exports = (sequelize, DataTypes) => {
  const ItemOption = sequelize.define(
    "ItemOption",
    {
      option_name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      option_price: DataTypes.DECIMAL,
    },
    {
      tableName: "ItemOptions",
      timestamps: false,
    }
  );
  ItemOption.associate = function (models) {
    ItemOption.hasMany(models.Item, { foreignKey: "option_name" });
    ItemOption.hasMany(models.ProductOptionItem, { foreignKey: "option_name" });
  };

  return ItemOption;
};
