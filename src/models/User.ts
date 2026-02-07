import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection.js';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  oauthProvider?: string;
  oauthId?: string;
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthTokenExpiresAt?: Date;
  // Keep legacy fields for backward compatibility
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare oauthProvider?: string;
  declare oauthId?: string;
  declare oauthAccessToken?: string;
  declare oauthRefreshToken?: string;
  declare oauthTokenExpiresAt?: Date;
  // Keep legacy fields for backward compatibility
  declare googleId?: string;
  declare googleAccessToken?: string;
  declare googleRefreshToken?: string;
  declare googleTokenExpiresAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    oauthProvider: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'oauth_provider',
      comment: 'OAuth provider name (google, github, microsoft)',
    },
    oauthId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'oauth_id',
      comment: 'User ID from OAuth provider',
    },
    oauthAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'oauth_access_token',
      comment: 'OAuth access token',
    },
    oauthRefreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'oauth_refresh_token',
      comment: 'OAuth refresh token',
    },
    oauthTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'oauth_token_expires_at',
      comment: 'OAuth token expiration time',
    },
    // Legacy Google-specific fields (kept for backward compatibility)
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    googleAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    googleRefreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    googleTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);
