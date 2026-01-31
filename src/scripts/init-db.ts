#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { config } from '../config/index.js';

const createDatabase = (dbName: string) => {
  try {
    // Check if database exists
    const checkCmd = `psql -U ${config.database.user} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${dbName}'"`;
    const exists = execSync(checkCmd, { encoding: 'utf-8' }).trim();

    if (exists === '1') {
      console.log(`✓ Database '${dbName}' already exists`);
      return;
    }

    // Create database
    const createCmd = `psql -U ${config.database.user} -d postgres -c "CREATE DATABASE ${dbName};"`;
    execSync(createCmd, { stdio: 'inherit' });
    console.log(`✓ Database '${dbName}' created successfully`);
  } catch (error) {
    console.error(
      `✗ Failed to create database '${dbName}':`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
};

const main = async () => {
  console.log('Initializing databases...\n');

  try {
    // Create development database
    createDatabase(config.database.name);

    // Create test database
    const testDbName = config.database.name + '_test';
    createDatabase(testDbName);

    console.log('\n✓ All databases initialized successfully!');
  } catch (error) {
    console.error('\n✗ Database initialization failed');
    console.error('Please ensure PostgreSQL is running and your credentials are correct in .env');
    process.exit(1);
  }
};

main();
