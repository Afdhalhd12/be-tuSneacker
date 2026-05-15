'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.Address,{
        foreignKey: "address_id"
      });

      Order.belongsTo(models.User,{
        foreignKey: "user_id"
      });

      Order.belongsTo(models.Payment,{
        foreignKey: "payment_id"
      });

      Order.hasMany(models.OrderItem, {
        foreignKey: "order_id",
        as: "items"
      });
    }
  }
  Order.init({
    user_id: DataTypes.BIGINT,
    address_id: DataTypes.BIGINT,
    payment_id: DataTypes.BIGINT,
    orderDate: DataTypes.DATE,
    totalPrice: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};