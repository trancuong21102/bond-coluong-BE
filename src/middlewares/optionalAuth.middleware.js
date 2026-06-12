import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * Middleware to optionally authorize requests by validating JWT.
 * Attaches the resolved user object to req.user if a valid token is present.
 * Does NOT throw an error or block the request if token is missing/invalid.
 */
export default async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
      },
    });

    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token is invalid or expired, just ignore and continue as guest
    next();
  }
}
