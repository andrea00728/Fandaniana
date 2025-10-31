"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = "taxibe_secret_key_2025";
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};
exports.authenticate = authenticate;
// Middleware pour vérifier les rôles spécifiques
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Non authentifié' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé - Permissions insuffisantes' });
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=authMiddleware.js.map