import { sequelize } from './src/database/connection.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global test setup - runs once before all test suites
 * This ensures database is in a clean state before any tests run
 */
export async function setup() {
  try {
    // Authenticate connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Drop all tables to start fresh
    await sequelize.getQueryInterface().dropAllTables();
    console.log('✓ Dropped all existing tables');

    // Run migrations to create schema (matching production)
    await execAsync('npx sequelize-cli db:migrate', {
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });
    console.log('✓ Migrations applied successfully');

    // Keep connection open for tests - they will reuse the connection pool
    // Tests call sequelize.authenticate() which will use the existing connection
    console.log('✓ Setup complete - tests will now run\n');
  } catch (error) {
    console.error('✗ Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Global test teardown - runs once after all test suites
 */
export async function teardown() {
  // Close database connection after all tests complete
  try {
    await sequelize.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Failed to close database connection:', error);
  }
}
