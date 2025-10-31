import { ActivityType } from '../entities/ActivityType';
export declare class ActivityTypeService {
    private activityTypeRepository;
    private transactionRepository;
    /**
     * Créer un nouveau type d'activité
     */
    create(nom: string, description?: string, icon?: string): Promise<ActivityType>;
    /**
     * Récupérer tous les types d'activités
     */
    findAll(): Promise<ActivityType[]>;
    /**
     * Récupérer tous les types avec comptage des transactions
     */
    findAllWithStats(): Promise<Array<ActivityType & {
        transaction_count: number;
    }>>;
    /**
     * Récupérer un type d'activité par ID
     */
    findById(id: number): Promise<ActivityType | null>;
    /**
     * Mettre à jour un type d'activité
     */
    update(id: number, data: Partial<ActivityType>): Promise<ActivityType>;
    /**
     * Supprimer un type d'activité (avec vérification)
     */
    delete(id: number): Promise<void>;
    /**
     * Obtenir les statistiques par type d'activité pour un utilisateur
     */
    getStatsForUser(firebaseUid: string): Promise<Array<{
        id: number;
        nom: string;
        icon: string;
        total_depenses: number;
        nombre_transactions: number;
        pourcentage: number;
    }>>;
    /**
     * Obtenir les types d'activités les plus utilisés par un utilisateur
     */
    getMostUsedByUser(firebaseUid: string, limit?: number): Promise<ActivityType[]>;
    /**
     * Rechercher des types d'activités par nom
     */
    search(query: string): Promise<ActivityType[]>;
}
//# sourceMappingURL=activityType.service.d.ts.map