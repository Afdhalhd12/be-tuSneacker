'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('Addresses', 'label', {
      type: Sequelize.ENUM('home', 'office'),
      defaultValue: 'home'
    });

    await queryInterface.addColumn('Addresses', 'isPrimary', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('Addresses', 'label');

    await queryInterface.removeColumn('Addresses', 'isPrimary');

  }
};