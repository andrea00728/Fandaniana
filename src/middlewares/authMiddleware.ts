import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = "taxibe_secret_key_2025";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, SECRET) as { uid: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

// Middleware pour vérifier les rôles spécifiques
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé - Permissions insuffisantes' });
    }

    next();
  };
};
