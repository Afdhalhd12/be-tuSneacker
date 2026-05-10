'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OrderItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      order_id: {
        type: Sequelize.BIGINT
      },
      product_id: {
        type: Sequelize.BIGINT
      },
      size_id: {
        type: Sequelize.BIGINT
      },
      qty: {
        type: Sequelize.INTEGER
      },
      price: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    // Mendefinisikan fk
    await queryInterface.addConstraint("OrderItems", {
      fields: ['order_id'], //Column fk
      type: 'foreign key',
      name: "fk_custom_order_id", //alias nya
      references: { //pk nya ada dimana
        table: "Orders",
        field: 'id' //nama pk nya
      },
      onDelete: 'CASCADE', //Jika pk dihapus, data FK ikut terhapus
      onUpdate: 'CASCADE', //Jika Pk(id) di ubah, id fk ikut terubah
    });

    await queryInterface.addConstraint("OrderItems", {
      fields: ['product_id'], //Column fk
      type: 'foreign key',
      name: "fk_custom_product_id", //alias nya
      references: { //pk nya ada dimana
        table: "Products",
        field: 'id' //nama pk nya
      },
      onDelete: 'CASCADE', //Jika pk dihapus, data FK ikut terhapus
      onUpdate: 'CASCADE', //Jika Pk(id) di ubah, id fk ikut terubah
    });

    await queryInterface.addConstraint("OrderItems", {
      fields: ['size_id'], //Column fk
      type: 'foreign key',
      name: "fk_custom_size_id", //alias nya
      references: { //pk nya ada dimana
        table: "Sizes",
        field: 'id' //nama pk nya
      },
      onDelete: 'CASCADE', //Jika pk dihapus, data FK ikut terhapus
      onUpdate: 'CASCADE', //Jika Pk(id) di ubah, id fk ikut terubah
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('OrderItems');
  }
};