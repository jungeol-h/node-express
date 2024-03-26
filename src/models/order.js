module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      order_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      shop_num: DataTypes.INTEGER,
      payment_amount: DataTypes.DECIMAL,
      order_date: DataTypes.DATE,
      order_name: DataTypes.STRING,
      shipping_fee: DataTypes.DECIMAL,
      shipping_type: DataTypes.STRING,
      canceled: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      // 다른 필드들도 여기에 정의합니다.
    },
    {
      tableName: "Orders",
      timestamps: false,
    }
  );

  Order.associate = function (models) {
    Order.hasMany(models.Item, { foreignKey: "order_id" });
  };

  return Order;
};
