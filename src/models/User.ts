import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection.js';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
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
