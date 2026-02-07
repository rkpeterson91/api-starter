import { Sequelize } from 'sequelize';
import { config } from '../config/index.js';

const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  dialect: 'postgres' as const,
  logging: config.env === 'development' ? console.log : false,
  ...(config.database.ssl && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // For AWS RDS
      },
    },
  }),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
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

    // In production/cloud, only use migrations (no auto-sync)
    // In development, use auto-sync for convenience
    if (config.isCloudEnvironment || config.env === 'production') {
      console.log('Production mode: Skipping auto-sync. Use migrations instead.');
      console.log('Run: pnpm migrate');
    } else {
      // Development mode: auto-sync tables (creates if they don't exist)
      await sequelize.sync({ alter: config.env === 'development' });
      console.log('Database models synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};
