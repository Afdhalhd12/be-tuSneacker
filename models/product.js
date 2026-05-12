'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Product.hasMany(models.ProductSize, {
        foreignKey: "product_id"
      });
    }
  }
  Product.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.INTEGER,
    image: {
      type : DataTypes.STRING,
      get(){
        // getter : memanipulasi data untuk responsenya
        const rawValue = this.getDataValue('image');
        //image yang di db cuman filename, di response jadi link yang bisa diuka/ditampulkan gambarnya
        return rawValue ? `http://localhost:3000/uploads/${rawValue}` : null;
      }
    },
    brand: DataTypes.STRING,
    category: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};