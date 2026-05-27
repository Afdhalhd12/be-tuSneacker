'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Address, {
        foreignKey: "user_id"
      });

      User.hasMany(models.Order, {
        foreignKey: "user_id"
      });


    }
  }
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    photoProfile: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('photoProfile');
        return rawValue
          ? `http://localhost:3000/uploads/${rawValue}`
          : null;
      }
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};