'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop legacy Google-specific OAuth columns if they exist
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.google_id) {
      await queryInterface.removeColumn('users', 'google_id');
    }
    if (tableDescription.google_access_token) {
      await queryInterface.removeColumn('users', 'google_access_token');
    }
    if (tableDescription.google_refresh_token) {
      await queryInterface.removeColumn('users', 'google_refresh_token');
    }
    if (tableDescription.google_token_expires_at) {
      await queryInterface.removeColumn('users', 'google_token_expires_at');
    }
  },

  async down(queryInterface, Sequelize) {
    // Restore legacy Google-specific OAuth columns
    await queryInterface.addColumn('users', 'google_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('users', 'google_access_token', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'google_refresh_token', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'google_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
