'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductSizes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      product_id: {
        type: Sequelize.BIGINT
      },
      size_id: {
        type: Sequelize.BIGINT
      },
      stock: {
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

    await queryInterface.addConstraint("ProductSizes", {
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

    await queryInterface.addConstraint("ProductSizes", {
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
    await queryInterface.dropTable('ProductSizes');
  }
};