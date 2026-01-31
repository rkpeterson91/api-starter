import { Sequelize } from 'sequelize';
import { config } from '../config/index.js';

const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  dialect: 'postgres' as const,
  logging: config.env === 'development' ? console.log : false,
};

export const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  dbConfig
);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models with database (creates tables if they don't exist)
    await sequelize.sync({ alter: config.env === 'development' });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};
