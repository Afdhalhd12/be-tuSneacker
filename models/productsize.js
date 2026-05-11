'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductSize extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProductSize.hasMany(models.OrderItem, {
        foreignKey: "product_size_id"
      });

      ProductSize.belongsTo(models.Product, {
        foreignKey: "product_id"
      });

      ProductSize.belongsTo(models.Size, {
        foreignKey: "size_id"
      });
    }
  }
  ProductSize.init({
    product_id: DataTypes.BIGINT,
    size_id: DataTypes.BIGINT,
    stock: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProductSize',
  });
  return ProductSize;
};