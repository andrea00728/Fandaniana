"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityTypeController = void 0;
const activityType_service_1 = require("../services/activityType.service");
class ActivityTypeController {
    constructor() {
        this.activityTypeService = new activityType_service_1.ActivityTypeService();
        /**
         * Créer un type d'activité (Admin uniquement)
         */
        this.create = async (req, res) => {
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
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        };
        /**
         * Récupérer tous les types d'activités
         */
        this.findAll = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
        /**
         * Récupérer un type d'activité par ID
         */
        this.findById = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
        /**
         * Mettre à jour un type d'activité (Admin uniquement)
         */
        this.update = async (req, res) => {
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
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        };
        /**
         * Supprimer un type d'activité (Admin uniquement)
         */
        this.delete = async (req, res) => {
            try {
                const id = Number(req.params.id);
                await this.activityTypeService.delete(id);
                res.status(200).json({
                    success: true,
                    message: 'Type d\'activité supprimé avec succès'
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        };
        /**
         * Obtenir les statistiques par type d'activité pour l'utilisateur connecté
         */
        this.getMyStats = async (req, res) => {
            try {
                const firebaseUid = req.user.uid;
                const stats = await this.activityTypeService.getStatsForUser(firebaseUid);
                res.status(200).json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
        /**
         * Obtenir les types d'activités les plus utilisés par l'utilisateur
         */
        this.getMostUsed = async (req, res) => {
            try {
                const firebaseUid = req.user.uid;
                const limit = req.query.limit ? parseInt(req.query.limit) : 5;
                const activityTypes = await this.activityTypeService.getMostUsedByUser(firebaseUid, limit);
                res.status(200).json({
                    success: true,
                    data: activityTypes
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
        /**
         * Rechercher des types d'activités
         */
        this.search = async (req, res) => {
            try {
                const query = req.query.q;
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
    }
}
exports.ActivityTypeController = ActivityTypeController;
//# sourceMappingURL=activityType.controller.js.map