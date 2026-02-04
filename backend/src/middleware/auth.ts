import { expressjwt, Request as JWTRequest } from "express-jwt";
import jwksRsa from "jwks-rsa";
import { Request, Response, NextFunction } from "express";
import { keycloakConfig } from "../config/keycloak.config";
import { User } from "../models/User";

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email?: string;
        roles: string[];
      };
    }
  }
}

/**
 * JWT Verification Middleware
 * Validates JWT token using Keycloak's public keys (JWKS)
 */
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: keycloakConfig.jwksUri,
  }) as any,
  audience: keycloakConfig.clientId,
  issuer: keycloakConfig.issuer,
  algorithms: ["RS256"],
  credentialsRequired: true,
});

/**
 * Role-Based Access Control Middleware
 * @param allowedRoles - Array of roles that can access the route
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const jwtReq = req as JWTRequest;

    if (!jwtReq.auth) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No valid token provided",
      });
    }

    // Extract roles from Keycloak JWT token
    const userRoles: string[] = jwtReq.auth.realm_access?.roles || [];

    // Check if user has at least one of the required roles
    const hasRequiredRole = allowedRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions",
        required: allowedRoles,
        actual: userRoles.filter((r) =>
          [
            "admin",
            "inventory_manager",
            "quality_control",
            "production",
            "viewer",
          ].includes(r),
        ),
      });
    }

    // Attach user info to request for use in controllers
    req.user = {
      id: jwtReq.auth.sub || "",
      username: jwtReq.auth.preferred_username || "",
      email: jwtReq.auth.email,
      roles: userRoles,
    };

    try {
      if (req.user.id) {
        const now = new Date();
        const [record, created] = await User.findOrCreate({
          where: { user_id: req.user.id },
          defaults: {
            user_id: req.user.id,
            username: req.user.username || req.user.id,
            email: req.user.email,
            created_at: now,
            last_seen_at: now,
          },
        });

        if (!created) {
          await record.update({
            username: req.user.username || record.username,
            email: req.user.email,
            last_seen_at: now,
          });
        }
      }
    } catch (error) {
      return res.status(500).json({
        error: "UserSyncFailed",
        message: "Failed to sync user snapshot",
      });
    }

    next();
  };
};

/**
 * Error handler for JWT authentication errors
 */
export const jwtErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
      details: err.message,
    });
  }
  next(err);
};
