'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT
      },
      address_id: {
        type: Sequelize.BIGINT
      },
      payment_id: {
        type: Sequelize.BIGINT
      },
      orderDate: {
        type: Sequelize.DATE
      },
      totalPrice: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
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
    await queryInterface.addConstraint("Orders", {
      fields: ['user_id'], //Column fk
      type: 'foreign key',
      name: "fk_orders_user_id", //alias nya
      references: { //pk nya ada dimana
        table: "Users",
        field: 'id' //nama pk nya
      },
      onDelete: 'CASCADE', //Jika pk dihapus, data FK ikut terhapus
      onUpdate: 'CASCADE', //Jika Pk(id) di ubah, id fk ikut terubah
    });

    await queryInterface.addConstraint("Orders", {
      fields: ['address_id'], //Column fk
      type: 'foreign key',
      name: "fk_custom_address_id", //alias nya
      references: { //pk nya ada dimana
        table: "Addresses",
        field: 'id' //nama pk nya
      },
      onDelete: 'CASCADE', //Jika pk dihapus, data FK ikut terhapus
      onUpdate: 'CASCADE', //Jika Pk(id) di ubah, id fk ikut terubah
    });

    await queryInterface.addConstraint("Orders", {
      fields: ['payment_id'], //Column fk
      type: 'foreign key',
      name: "fk_custom_payment_id", //alias nya
      references: { //pk nya ada dimana
        table: "Payments",
        field: 'id' //nama pk nya
      },
      onDelete: 'CASCADE', //Jika pk dihapus, data FK ikut terhapus
      onUpdate: 'CASCADE', //Jika Pk(id) di ubah, id fk ikut terubah
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};