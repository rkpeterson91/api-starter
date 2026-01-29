import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/index.js';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export const authRoutes = async (fastify: FastifyInstance) => {
  // OAuth callback handler
  fastify.get('/auth/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!fastify.googleOAuth2) {
        return reply.code(503).send({ 
          error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET' 
        });
      }

      const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      
      // Fetch user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await response.json() as GoogleUserInfo;

      // Calculate token expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (token.expires_in || 3600));

      // Create or find user in database
      const [user] = await User.findOrCreate({
        where: { email: userInfo.email },
        defaults: { 
          name: userInfo.name, 
          email: userInfo.email,
          googleId: userInfo.id,
          googleAccessToken: token.access_token,
          googleRefreshToken: token.refresh_token,
          googleTokenExpiresAt: expiresAt,
        },
      });

      // Update Google tokens and ID for existing users
      if (user.googleId !== userInfo.id || user.googleAccessToken !== token.access_token) {
        user.googleId = userInfo.id;
        user.googleAccessToken = token.access_token;
        user.googleRefreshToken = token.refresh_token || user.googleRefreshToken;
        user.googleTokenExpiresAt = expiresAt;
        await user.save();
      }

      // Issue JWT token
      const jwtToken = fastify.jwt.sign({ 
        userId: user.id, 
        email: user.email 
      }, {
        expiresIn: '7d',
      });

      // Set refresh token in cookie
      reply.setCookie('refreshToken', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return reply.send({ 
        success: true,
        token: jwtToken, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Authentication failed' });
    }
  });

  // Get current user
  fastify.get('/auth/me', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await User.findByPk(request.user!.userId, {
        attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({ user });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch user' });
    }
  });

  // Logout
  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .clearCookie('refreshToken')
      .send({ success: true, message: 'Logged out successfully' });
  });

  // Health check for auth system
  fastify.get('/auth/status', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      googleOAuthConfigured: !!fastify.googleOAuth2,
      loginUrl: fastify.googleOAuth2 ? '/auth/google' : null,
    });
  });

  // Development-only: Generate test token
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/auth/dev/token', async (request: FastifyRequest, reply: FastifyReply) => {
      const { email, name } = request.body as { email?: string; name?: string };

      if (!email) {
        return reply.code(400).send({ error: 'email is required' });
      }

      // Find or create user
      const [user] = await User.findOrCreate({
        where: { email },
        defaults: { 
          name: name || 'Test User', 
          email,
        },
      });

      // Generate token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
      }, {
        expiresIn: '7d',
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    });
  }
};
