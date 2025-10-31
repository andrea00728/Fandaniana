import { Router } from 'express';
import { ActivityTypeController } from '../controllers/activityType.controller';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const ActiviteRouter = Router();
const activityTypeController = new ActivityTypeController();

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Gestion des types d'activités (catégories de dépenses)
 */

/**
 * @swagger
 * /Activity:
 *   get:
 *     summary: Récupérer tous les types d'activités
 *     tags: [ActivityTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Inclure les statistiques d'utilisation
 *     responses:
 *       200:
 *         description: Liste des types d'activités
 */
ActiviteRouter.get('/', authenticate, activityTypeController.findAll);

/**
 * @swagger
 * /Activity/search:
 *   get:
 *     summary: Rechercher des types d'activités
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Résultats de recherche
 */
ActiviteRouter.get('/search', authenticate, activityTypeController.search);

/**
 * @swagger
 * /Activity/my-stats:
 *   get:
 *     summary: Obtenir mes statistiques par type d'activité
 *     tags: [ActivityT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques détaillées par catégorie
 */
ActiviteRouter.get('/my-stats', authenticate, activityTypeController.getMyStats);

/**
 * @swagger
 * /Activity/most-used:
 *   get:
 *     summary: Obtenir mes types d'activités les plus utilisés
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Types d'activités les plus fréquents
 */
ActiviteRouter.get('/most-used', authenticate, activityTypeController.getMostUsed);

/**
 * @swagger
 * /Activity/{id}:
 *   get:
 *     summary: Récupérer un type d'activité par ID
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails du type d'activité
 *       404:
 *         description: Type d'activité introuvable
 */
ActiviteRouter.get('/:id', authenticate, activityTypeController.findById);

/**
 * @swagger
 * /Activity:
 *   post:
 *     summary: Créer un nouveau type d'activité (Admin uniquement)
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Type d'activité créé
 *       403:
 *         description: Accès réservé aux administrateurs
 */
ActiviteRouter.post('/', authenticate, activityTypeController.create);

/**
 * @swagger
 * /Activity/{id}:
 *   put:
 *     summary: Mettre à jour un type d'activité (Admin uniquement)
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Type d'activité mis à jour
 *       403:
 *         description: Accès réservé aux administrateurs
 */
ActiviteRouter.put('/:id', authenticate, activityTypeController.update);

/**
 * @swagger
 * /Activity/{id}:
 *   delete:
 *     summary: Supprimer un type d'activité (Admin uniquement)
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Type d'activité supprimé
 *       400:
 *         description: Impossible de supprimer (transactions liées)
 *       403:
 *         description: Accès réservé aux administrateurs
 */
ActiviteRouter.delete('/:id', authenticate, activityTypeController.delete);

export default ActiviteRouter;
