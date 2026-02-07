module.exports = {
  async up(queryInterface, Sequelize) {
    // Add generic OAuth fields
    await queryInterface.addColumn('users', 'oauth_provider', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'OAuth provider name (google, github, microsoft)',
    });

    await queryInterface.addColumn('users', 'oauth_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'User ID from OAuth provider',
    });

    await queryInterface.addColumn('users', 'oauth_access_token', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'OAuth access token',
    });

    await queryInterface.addColumn('users', 'oauth_refresh_token', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'OAuth refresh token',
    });

    await queryInterface.addColumn('users', 'oauth_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'OAuth token expiration time',
    });

    // Note: No existing Google OAuth data to migrate as legacy fields never existed
  },

  async down(queryInterface, Sequelize) {
    // Remove generic OAuth fields
    await queryInterface.removeColumn('users', 'oauth_provider');
    await queryInterface.removeColumn('users', 'oauth_id');
    await queryInterface.removeColumn('users', 'oauth_access_token');
    await queryInterface.removeColumn('users', 'oauth_refresh_token');
    await queryInterface.removeColumn('users', 'oauth_token_expires_at');
  },
};
