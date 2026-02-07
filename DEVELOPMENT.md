# Development Guide

Complete guide for developing and extending this API starter.

## 📁 Project Structure

```
src/
├── __tests__/              # Test files
│   └── userRoutes.test.ts  # User routes tests
├── config/
│   └── index.ts            # Centralized configuration management
├── database/
│   └── connection.ts       # Database connection with pooling
├── i18n/
│   └── messages.ts         # Multi-language translations (en, es, fr)
├── models/
│   ├── index.ts            # Model exports
│   └── User.ts             # User model with OAuth and role fields
├── plugins/
│   ├── auth.ts             # Authentication (OAuth2, JWT, cookies)
│   ├── rbac.ts             # Role-based access control
│   └── swagger.ts          # OpenAPI documentation
├── routes/
│   ├── auth/               # /auth endpoints
│   │   └── index.ts
│   └── api/                # /api endpoints
│       ├── users/          # /api/users CRUD operations
│       │   └── index.ts
│       └── admin/          # /api/admin admin-only operations
│           └── index.ts
├── schemas/
│   └── common.ts           # Shared JSON schemas (DRY principle)
├── scripts/
│   └── init-db.ts          # Database initialization
├── utils/
│   └── errors.ts           # Error handling utilities
├── index.ts                # Application entry point
└── server.ts               # Fastify server configuration

scripts/
├── quickstart.sh           # Interactive setup script
└── customize.sh            # Project customization script

.github/
└── workflows/
  └── ci.yml              # Test, build, and Docker publish pipeline
```

## 🛠️ Tech Stack Details

### Core Framework

- **Fastify 5.x** - High-performance web framework
  - Auto-detects pino-pretty for dev logging
  - JSON Schema validation
  - Plugin ecosystem

### Database

- **PostgreSQL** - Relational database
- **Sequelize 6.x** - ORM with TypeScript support
- **Connection Pooling**: max 10, min 2, acquire 30s, idle 10s

### Authentication

- **@fastify/jwt** - JWT token generation and validation
- **@fastify/oauth2** - Multi-provider OAuth2 integration (Google, GitHub, Microsoft)
- **@fastify/cookie** - Secure cookie management

### Documentation

- **@fastify/swagger** - OpenAPI 3.0 spec generation
- **@fastify/swagger-ui** - Interactive API documentation

### Development

- **TypeScript** - Type safety with ES2022 modules
- **tsx** - Fast TypeScript execution and watch mode
- **Vitest** - Fast unit testing with coverage
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit formatting

## 🔧 Configuration System

All configuration is centralized in [src/config/index.ts](src/config/index.ts):

```typescript
export const config = {
  env: string,           // NODE_ENV
  port: number,          // Server port
  database: {            // PostgreSQL config
    host: string,
    port: number,
    name: string,
    user: string,
    password: string,
  },
  jwt: {
    secret: string,      // JWT signing secret
  },
  oauth: {
    google: {
      clientId?: string,
      clientSecret?: string,
      enabled: boolean,  // Auto-set based on credentials
    },
  },
  appUrl: string,        // Application URL
};
```

## 🎨 Code Patterns

### Shared Schemas (DRY Principle)

All JSON schemas are centralized in [src/schemas/common.ts](src/schemas/common.ts):

```typescript
// Reusable across routes
export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    // ...
  },
} as const;
```

### Error Handling

Centralized error handling in [src/utils/errors.ts](src/utils/errors.ts):

```typescript
import { sendError } from '../utils/errors.js';

// In routes
if (!user) {
  return sendError(reply, 404, messages.errors.userNotFound);
}
```

### Internationalization

Multi-language support via [src/i18n/messages.ts](src/i18n/messages.ts):

```typescript
import { getMessages, type Locale } from '../i18n/messages.js';

// In routes
const locale = (request as any).locale as Locale;
const messages = getMessages(locale);
return sendError(reply, 404, messages.errors.userNotFound);
```

Languages auto-detected from `Accept-Language` header.

### Role-Based Access Control (RBAC)

Protect routes with role requirements:

```typescript
// Single role
fastify.get(
  '/admin-only',
  {
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
  },
  handler
);

// Multiple roles
fastify.get(
  '/user-or-admin',
  {
    onRequest: [fastify.authenticate, fastify.requireRole(['user', 'admin'])],
  },
  handler
);

// In handler
await request.requireRole('admin'); // Throws 403 if not admin
```

Roles are stored in the `role` column of the `users` table:

- `'user'` - Default role for all new users
- `'admin'` - Administrative access

### Optimized Database Queries

**Before (N+1 problem):**

```typescript
const user = await User.findByPk(id);
if (user) {
  user.name = name;
  await user.save(); // 2 queries
}
```

**After (single query):**

```typescript
const [affectedCount, affectedRows] = await User.update(
  { name },
  { where: { id }, returning: true }
); // 1 query
```

## 🧪 Testing Guide

### Running Tests

```bash
pnpm test              # Watch mode
pnpm test --run        # Run once
pnpm test:coverage     # With coverage
```

### Test Database

- **Name**: `api_starter_db_test`
- **Credentials**: Configured in [vitest.config.ts](vitest.config.ts)
- **Reset**: Database cleaned before each test

### Writing Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Feature', () => {
  beforeAll(async () => {
    // Setup
  });

  it('should do something', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/endpoint',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
  });

  afterAll(async () => {
    // Cleanup
  });
});
```

## 🔌 Adding New Endpoints

### 1. Create Route File

```typescript
// src/routes/myRoutes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getMessages, type Locale } from '../i18n/messages.js';
import { sendError } from '../utils/errors.js';

export const myRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/my-endpoint',
    {
      schema: {
        tags: ['MyFeature'],
        description: 'My endpoint description',
        response: {
          200: { type: 'object', properties: { data: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        // Your logic here
        return reply.send({ data: 'success' });
      } catch (error) {
        request.log.error(error);
        return sendError(reply, 500, 'Error message');
      }
    }
  );
};
```

### 2. Register in index.ts

```typescript
import { myRoutes } from './routes/myRoutes.js';

// ...
await server.register(myRoutes, { prefix: '/api/my-feature' });
```

### 3. Add Tests

```typescript
// src/__tests__/myRoutes.test.ts
describe('My Routes', () => {
  it('should work', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/my-feature/my-endpoint',
    });
    expect(response.statusCode).toBe(200);
  });
});
```

## 🗄️ Adding New Models

### 1. Create Model

```typescript
// src/models/MyModel.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection.js';

interface MyModelAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MyModelCreationAttributes extends Optional<MyModelAttributes, 'id'> {}

export class MyModel
  extends Model<MyModelAttributes, MyModelCreationAttributes>
  implements MyModelAttributes
{
  declare id: number;
  declare name: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MyModel.init(
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
  },
  {
    sequelize,
    tableName: 'my_models',
    timestamps: true,
  }
);
```

### 2. Export from models/index.ts

```typescript
export { MyModel } from './MyModel.js';
```

### 3. Use in Routes

```typescript
import { MyModel } from '../models/index.js';

const items = await MyModel.findAll();
```

## 🌐 Adding i18n Translations

Edit [src/i18n/messages.ts](src/i18n/messages.ts):

```typescript
const messages: Record<Locale, Messages> = {
  en: {
    errors: {
      myNewError: 'My error message',
    },
  },
  es: {
    errors: {
      myNewError: 'Mi mensaje de error',
    },
  },
  fr: {
    errors: {
      myNewError: "Mon message d'erreur",
    },
  },
};
```

## 🚀 Production Deployment

### Environment Variables

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your-super-long-random-secret-min-32-chars
APP_URL=https://your-domain.com
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
```

### Build and Run

```bash
# Build TypeScript
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

### Docker Production

```bash
# Build image
docker build -t my-api .

# Run container
docker run -p 3000:3000 --env-file .env.production my-api
```

### Security Checklist

- [ ] Change JWT_SECRET to strong random string (32+ characters)
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags (`secure: true`)
- [ ] Configure CORS for your domain
- [ ] Enable rate limiting
- [ ] Use environment-specific .env files
- [ ] Never commit .env files
- [ ] Rotate secrets regularly
- [ ] Keep dependencies updated

## 📊 Performance Optimization

### Database

- Connection pooling configured (max: 10)
- Use indexes on frequently queried columns
- Optimize N+1 queries with `include`

### Caching

- Consider Redis for session storage
- Cache frequently accessed data
- Use ETags for API responses

### Monitoring

- Add Prometheus metrics
- Configure APM (Application Performance Monitoring)
- Set up error tracking (Sentry, etc.)

## 🔍 Debugging

### Enable Verbose Logging

```typescript
// In development
fastify.log.level = 'debug';
```

### Database Query Logging

Already enabled in development via [src/database/connection.ts](src/database/connection.ts):

```typescript
logging: config.env === 'development' ? console.log : false,
```

### Request/Response Logging

Built-in via server hooks in [src/server.ts](src/server.ts) (development only).

## 🤝 Contributing Guidelines

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Format** code: `pnpm format`
4. **Test**: `pnpm test`
5. **Commit**: Use conventional commits (`feat:`, `fix:`, `refactor:`)
6. **Push**: `git push origin feature/my-feature`
7. **PR**: Create pull request with description

## 📚 Additional Resources

- [Fastify Documentation](https://www.fastify.io/)
- [Sequelize Documentation](https://sequelize.org/)
- [Vitest Documentation](https://vitest.dev/)
- [OpenAPI Specification](https://swagger.io/specification/)
