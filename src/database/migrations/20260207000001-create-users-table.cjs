'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      googleId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        field: 'google_id',
      },
      googleAccessToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'google_access_token',
      },
      googleRefreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'google_refresh_token',
      },
      googleTokenExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'google_token_expires_at',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    });

    // Add indexes
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['google_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
};
