import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class ActivityTypeController {
    private activityTypeService;
    /**
     * Créer un type d'activité (Admin uniquement)
     */
    create: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Récupérer tous les types d'activités
     */
    findAll: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Récupérer un type d'activité par ID
     */
    findById: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Mettre à jour un type d'activité (Admin uniquement)
     */
    update: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Supprimer un type d'activité (Admin uniquement)
     */
    delete: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Obtenir les statistiques par type d'activité pour l'utilisateur connecté
     */
    getMyStats: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Obtenir les types d'activités les plus utilisés par l'utilisateur
     */
    getMostUsed: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Rechercher des types d'activités
     */
    search: (req: AuthRequest, res: Response) => Promise<void>;
}
//# sourceMappingURL=activityType.controller.d.ts.map