module.exports = (sequelize, DataTypes) => {
  const Option = sequelize.define(
    "Option",
    {
      option_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      option_name: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      option_price: DataTypes.DECIMAL,
    },
    {
      tableName: "Options",
      timestamps: false,
    }
  );
  Option.associate = function (models) {
    Option.hasMany(models.Item, { foreignKey: "option_id" });
    Option.hasMany(models.ProductOption, { foreignKey: "option_id" });
  };

  return Option;
};
