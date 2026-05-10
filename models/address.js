'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Address.belongsTo(models.User,{
        foreignKey: "user_id"
      });

      Address.hasMany(models.Order, {
        foreignKey: "address_id"
      });
    }
  }
  Address.init({
    user_id: DataTypes.BIGINT,
    addressLine: DataTypes.STRING,
    city: DataTypes.STRING,
    postalCode: DataTypes.STRING,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Address',
  });
  return Address;
};