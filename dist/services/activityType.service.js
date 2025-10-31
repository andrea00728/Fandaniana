"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityTypeService = void 0;
const data_source_1 = require("../config/data-source");
const ActivityType_1 = require("../entities/ActivityType");
const Transaction_1 = require("../entities/Transaction");
class ActivityTypeService {
    constructor() {
        this.activityTypeRepository = data_source_1.AppDataSource.getRepository(ActivityType_1.ActivityType);
        this.transactionRepository = data_source_1.AppDataSource.getRepository(Transaction_1.Transaction);
    }
    /**
     * Créer un nouveau type d'activité
     */
    async create(nom, description, icon) {
        // Vérifier si le nom existe déjà
        const existing = await this.activityTypeRepository.findOne({ where: { nom } });
        if (existing) {
            throw new Error(`Le type d'activité "${nom}" existe déjà`);
        }
        const activityType = this.activityTypeRepository.create({
            nom,
            description,
            icon
        });
        return await this.activityTypeRepository.save(activityType);
    }
    /**
     * Récupérer tous les types d'activités
     */
    async findAll() {
        return await this.activityTypeRepository.find({
            order: { nom: 'ASC' }
        });
    }
    /**
     * Récupérer tous les types avec comptage des transactions
     */
    async findAllWithStats() {
        const result = await this.activityTypeRepository
            .createQueryBuilder('activity_type')
            .leftJoinAndSelect('activity_type.transactions', 'transaction')
            .loadRelationCountAndMap('activity_type.transaction_count', 'activity_type.transactions')
            .orderBy('activity_type.nom', 'ASC')
            .getMany();
        return result;
    }
    /**
     * Récupérer un type d'activité par ID
     */
    async findById(id) {
        return await this.activityTypeRepository.findOne({
            where: { id },
            relations: ['transactions']
        });
    }
    /**
     * Mettre à jour un type d'activité
     */
    async update(id, data) {
        const activityType = await this.activityTypeRepository.findOne({ where: { id } });
        if (!activityType) {
            throw new Error('Type d\'activité introuvable');
        }
        // Vérifier si le nouveau nom existe déjà (pour un autre ID)
        if (data.nom) {
            const existing = await this.activityTypeRepository.findOne({
                where: { nom: data.nom }
            });
            if (existing && existing.id !== id) {
                throw new Error(`Le nom "${data.nom}" est déjà utilisé`);
            }
        }
        Object.assign(activityType, data);
        return await this.activityTypeRepository.save(activityType);
    }
    /**
     * Supprimer un type d'activité (avec vérification)
     */
    async delete(id) {
        const activityType = await this.activityTypeRepository.findOne({
            where: { id },
            relations: ['transactions']
        });
        if (!activityType) {
            throw new Error('Type d\'activité introuvable');
        }
        // Vérifier s'il y a des transactions liées
        const transactionCount = await this.transactionRepository.count({
            where: { activity_type_id: id }
        });
        if (transactionCount > 0) {
            throw new Error(`Impossible de supprimer ce type d'activité. ${transactionCount} transaction(s) y sont associées.`);
        }
        await this.activityTypeRepository.remove(activityType);
    }
    /**
     * Obtenir les statistiques par type d'activité pour un utilisateur
     */
    async getStatsForUser(firebaseUid) {
        const result = await this.activityTypeRepository
            .createQueryBuilder('at')
            .leftJoin('at.transactions', 't')
            .leftJoin('t.wallet', 'w')
            .select('at.id', 'id')
            .addSelect('at.nom', 'nom')
            .addSelect('at.icon', 'icon')
            .addSelect('COALESCE(SUM(t.montant), 0)', 'total_depenses')
            .addSelect('COUNT(t.id)', 'nombre_transactions')
            .where('w.firebase_uid = :uid', { uid: firebaseUid })
            .groupBy('at.id')
            .addGroupBy('at.nom')
            .addGroupBy('at.icon')
            .orderBy('total_depenses', 'DESC')
            .getRawMany();
        // Calculer le total pour le pourcentage
        const totalDepenses = result.reduce((sum, r) => sum + Number(r.total_depenses), 0);
        return result.map(r => ({
            id: r.id,
            nom: r.nom,
            icon: r.icon,
            total_depenses: Number(r.total_depenses),
            nombre_transactions: Number(r.nombre_transactions),
            pourcentage: totalDepenses > 0 ? (Number(r.total_depenses) / totalDepenses) * 100 : 0
        }));
    }
    /**
     * Obtenir les types d'activités les plus utilisés par un utilisateur
     */
    async getMostUsedByUser(firebaseUid, limit = 5) {
        const result = await this.activityTypeRepository
            .createQueryBuilder('at')
            .leftJoin('at.transactions', 't')
            .leftJoin('t.wallet', 'w')
            .where('w.firebase_uid = :uid', { uid: firebaseUid })
            .groupBy('at.id')
            .orderBy('COUNT(t.id)', 'DESC')
            .limit(limit)
            .getMany();
        return result;
    }
    /**
     * Rechercher des types d'activités par nom
     */
    async search(query) {
        return await this.activityTypeRepository
            .createQueryBuilder('at')
            .where('LOWER(at.nom) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(at.description) LIKE LOWER(:query)', { query: `%${query}%` })
            .orderBy('at.nom', 'ASC')
            .getMany();
    }
}
exports.ActivityTypeService = ActivityTypeService;
//# sourceMappingURL=activityType.service.js.map