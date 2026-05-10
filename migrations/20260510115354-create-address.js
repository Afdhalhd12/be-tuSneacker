'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Addresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT
      },
      addressLine: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      postalCode: {
        type: Sequelize.STRING
      },
      notes: {
        type: Sequelize.TEXT
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
    await queryInterface.addConstraint("Addresses", {
      fields: ['user_id'], //Column fk
      type: 'foreign key',
      name: "fk_custom_user_id", //alias nya
      references: { //pk nya ada dimana
        table: "Users",
        field: 'id' //nama pk nya
      },
      onDelete: 'CASCADE', //Jika pk dihapus, data FK ikut terhapus
      onUpdate: 'CASCADE', //Jika Pk(id) di ubah, id fk ikut terubah
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Addresses');
  }
};