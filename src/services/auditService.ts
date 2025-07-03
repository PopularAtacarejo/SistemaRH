export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, { before: any; after: any }>;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditAction {
  userId: string;
  userName: string;
  type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export';
  resourceType: 'candidate' | 'user' | 'comment' | 'reminder' | 'status' | 'system';
  resourceId: string;
  changes?: Record<string, { before: any; after: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private static cache: AuditEntry[] = [];
  private static lastCacheUpdate = 0;
  private static readonly CACHE_DURATION = 60 * 1000; // 1 minuto

  static async logAction(action: AuditAction): Promise<void> {
    try {
      const auditEntry: AuditEntry = {
        id: crypto.randomUUID(),
        userId: action.userId,
        userName: action.userName,
        action: action.type,
        resourceType: action.resourceType,
        resourceId: action.resourceId,
        changes: action.changes,
        metadata: action.metadata,
        timestamp: new Date().toISOString(),
        ipAddress: action.ipAddress || this.getClientIP(),
        userAgent: action.userAgent || navigator.userAgent
      };

      console.log('📋 Auditoria:', auditEntry);

      // Salvar no GitHub
      await this.saveAuditEntry(auditEntry);

      // Atualizar cache local
      this.cache.unshift(auditEntry);
      
      // Manter apenas os últimos 1000 entries no cache
      if (this.cache.length > 1000) {
        this.cache = this.cache.slice(0, 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao registrar auditoria:', error);
      // Não falhar a operação principal por causa da auditoria
    }
  }

  static async getAuditTrail(resourceId?: string, resourceType?: string, limit = 100): Promise<AuditEntry[]> {
    try {
      let entries = await this.getAllAuditEntries();

      // Filtrar por recurso se especificado
      if (resourceId) {
        entries = entries.filter(entry => entry.resourceId === resourceId);
      }

      // Filtrar por tipo de recurso se especificado
      if (resourceType) {
        entries = entries.filter(entry => entry.resourceType === resourceType);
      }

      // Ordenar por timestamp (mais recentes primeiro)
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limitar resultados
      return entries.slice(0, limit);
    } catch (error) {
      console.error('❌ Erro ao buscar trilha de auditoria:', error);
      return [];
    }
  }

  static async getUserActivity(userId: string, days = 30): Promise<AuditEntry[]> {
    try {
      const entries = await this.getAllAuditEntries();
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      return entries.filter(entry => 
        entry.userId === userId && 
        new Date(entry.timestamp) >= cutoffDate
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('❌ Erro ao buscar atividade do usuário:', error);
      return [];
    }
  }

  static async getSystemStats(days = 30): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByUser: Record<string, number>;
    actionsByResource: Record<string, number>;
    actionsPerDay: Record<string, number>;
  }> {
    try {
      const entries = await this.getAllAuditEntries();
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const recentEntries = entries.filter(entry => 
        new Date(entry.timestamp) >= cutoffDate
      );

      const stats = {
        totalActions: recentEntries.length,
        actionsByType: {} as Record<string, number>,
        actionsByUser: {} as Record<string, number>,
        actionsByResource: {} as Record<string, number>,
        actionsPerDay: {} as Record<string, number>
      };

      recentEntries.forEach(entry => {
        // Contar por tipo de ação
        stats.actionsByType[entry.action] = (stats.actionsByType[entry.action] || 0) + 1;
        
        // Contar por usuário
        stats.actionsByUser[entry.userName] = (stats.actionsByUser[entry.userName] || 0) + 1;
        
        // Contar por tipo de recurso
        stats.actionsByResource[entry.resourceType] = (stats.actionsByResource[entry.resourceType] || 0) + 1;
        
        // Contar por dia
        const day = entry.timestamp.split('T')[0];
        stats.actionsPerDay[day] = (stats.actionsPerDay[day] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Erro ao gerar estatísticas do sistema:', error);
      return {
        totalActions: 0,
        actionsByType: {},
        actionsByUser: {},
        actionsByResource: {},
        actionsPerDay: {}
      };
    }
  }

  private static async getAllAuditEntries(): Promise<AuditEntry[]> {
    // Verificar cache
    if (this.isCacheValid()) {
      return this.cache;
    }

    try {
      const { GitHubService } = await import('./githubService');
      const entries = await GitHubService.getRawFile('audit-log.json') || [];
      
      this.cache = entries;
      this.lastCacheUpdate = Date.now();
      
      return entries;
    } catch (error) {
      console.error('❌ Erro ao buscar logs de auditoria:', error);
      return this.cache; // Retornar cache se houver erro
    }
  }

  private static async saveAuditEntry(entry: AuditEntry): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      
      // Buscar entradas existentes
      let entries: AuditEntry[] = [];
      try {
        const file = await GitHubService.getFile('audit-log.json');
        entries = file?.content || [];
      } catch (error) {
        // Arquivo não existe ainda
      }

      // Adicionar nova entrada
      entries.unshift(entry);

      // Manter apenas os últimos 10000 registros para não sobrecarregar o GitHub
      if (entries.length > 10000) {
        entries = entries.slice(0, 10000);
      }

      // Salvar
      const file = await GitHubService.getFile('audit-log.json');
      await GitHubService.saveFile(
        'audit-log.json',
        entries,
        `Registro de auditoria: ${entry.action} em ${entry.resourceType}`,
        file?.sha
      );
    } catch (error) {
      console.error('❌ Erro ao salvar entrada de auditoria:', error);
      throw error;
    }
  }

  private static isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.CACHE_DURATION && this.cache.length > 0;
  }

  private static getClientIP(): string {
    // Em um ambiente real, isso seria fornecido pelo servidor
    return 'unknown';
  }

  // Métodos de conveniência para tipos específicos de auditoria
  static async logUserAction(userId: string, userName: string, action: 'login' | 'logout' | 'password_change'): Promise<void> {
    await this.logAction({
      userId,
      userName,
      type: action as any,
      resourceType: 'user',
      resourceId: userId
    });
  }

  static async logCandidateAction(
    userId: string, 
    userName: string, 
    action: 'create' | 'update' | 'delete' | 'view',
    candidateId: string,
    changes?: Record<string, { before: any; after: any }>
  ): Promise<void> {
    await this.logAction({
      userId,
      userName,
      type: action,
      resourceType: 'candidate',
      resourceId: candidateId,
      changes
    });
  }

  static async logStatusChange(
    userId: string,
    userName: string,
    candidateId: string,
    fromStatus: string,
    toStatus: string
  ): Promise<void> {
    await this.logAction({
      userId,
      userName,
      type: 'update',
      resourceType: 'status',
      resourceId: candidateId,
      changes: {
        status: { before: fromStatus, after: toStatus }
      }
    });
  }

  static async logCommentAction(
    userId: string,
    userName: string,
    action: 'create' | 'update' | 'delete',
    candidateId: string,
    commentId: string,
    commentText?: string
  ): Promise<void> {
    await this.logAction({
      userId,
      userName,
      type: action,
      resourceType: 'comment',
      resourceId: commentId,
      metadata: {
        candidateId,
        commentText: action === 'delete' ? undefined : commentText
      }
    });
  }

  static async logDataExport(
    userId: string,
    userName: string,
    exportType: string,
    recordCount: number
  ): Promise<void> {
    await this.logAction({
      userId,
      userName,
      type: 'export',
      resourceType: 'system',
      resourceId: 'data-export',
      metadata: {
        exportType,
        recordCount
      }
    });
  }
}