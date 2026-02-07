import { buildServer } from './server.js';
import { connectDatabase } from './database/connection.js';
import { config } from './config/index.js';
import './models/index.js';
import { userRoutes } from './routes/api/users/index.js';
import { authRoutes } from './routes/auth/index.js';
import authPlugin from './plugins/auth.js';
import swaggerPlugin from './plugins/swagger.js';

const start = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Build Fastify server
    const server = buildServer();

    // Register Swagger documentation (before routes)
    await server.register(swaggerPlugin);

    // Register auth plugin
    await server.register(authPlugin);

    // Register routes
    await server.register(authRoutes);
    await server.register(userRoutes, { prefix: '/api/users' });

    // Start server
    await server.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${config.port}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

start();
