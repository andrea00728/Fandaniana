import { Response } from 'express';
import { ActivityTypeService } from '../services/activityType.service';
import { AuthRequest } from '../middlewares/authMiddleware';


export class ActivityTypeController {
  private activityTypeService = new ActivityTypeService();

  /**
   * Créer un type d'activité (Admin uniquement)
   */
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { nom, description, icon } = req.body;

      if (!nom) {
        res.status(400).json({
          success: false,
          message: 'Le nom est obligatoire'
        });
        return;
      }

      const activityType = await this.activityTypeService.create(nom, description, icon);

      res.status(201).json({
        success: true,
        message: 'Type d\'activité créé avec succès',
        data: activityType
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Récupérer tous les types d'activités
   */
  findAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const withStats = req.query.stats === 'true';

      const activityTypes = withStats 
        ? await this.activityTypeService.findAllWithStats()
        : await this.activityTypeService.findAll();

      res.status(200).json({
        success: true,
        data: activityTypes,
        count: activityTypes.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Récupérer un type d'activité par ID
   */
  findById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const activityType = await this.activityTypeService.findById(id);

      if (!activityType) {
        res.status(404).json({
          success: false,
          message: 'Type d\'activité introuvable'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: activityType
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Mettre à jour un type d'activité (Admin uniquement)
   */
  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { nom, description, icon } = req.body;

      const activityType = await this.activityTypeService.update(id, {
        nom,
        description,
        icon
      });

      res.status(200).json({
        success: true,
        message: 'Type d\'activité mis à jour avec succès',
        data: activityType
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Supprimer un type d'activité (Admin uniquement)
   */
  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      await this.activityTypeService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Type d\'activité supprimé avec succès'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Obtenir les statistiques par type d'activité pour l'utilisateur connecté
   */
  getMyStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const firebaseUid = req.user!.uid;
      const stats = await this.activityTypeService.getStatsForUser(firebaseUid);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Obtenir les types d'activités les plus utilisés par l'utilisateur
   */
  getMostUsed = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const firebaseUid = req.user!.uid;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const activityTypes = await this.activityTypeService.getMostUsedByUser(firebaseUid, limit);

      res.status(200).json({
        success: true,
        data: activityTypes
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Rechercher des types d'activités
   */
  search = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string;

      if (!query || query.length < 2) {
        res.status(400).json({
          success: false,
          message: 'La recherche doit contenir au moins 2 caractères'
        });
        return;
      }

      const results = await this.activityTypeService.search(query);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
}
