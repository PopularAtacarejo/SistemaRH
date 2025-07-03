// 📊 SERVIÇO DE LOG DE AUDITORIA - ACESSO RESTRITO
// Registra todas as ações dos usuários - Apenas para Desenvolvedor

import { GitHubDataService } from './githubDataService';
import { SimpleAuthService } from './simpleAuthService';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  description: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  oldData?: any;
  newData?: any;
  timestamp: string;
  userAgent: string;
  ip: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  repository: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  monthLogs: number;
  criticalLogs: number;
  userActions: { [userId: string]: number };
  actionTypes: { [action: string]: number };
  lastActivity: string;
}

export class AuditLogService {
  private static sessionId = crypto.randomUUID();

  // === VERIFICAÇÃO DE PERMISSÃO ===

  private static canAccessLogs(): boolean {
    const currentUser = SimpleAuthService.getCurrentUser();
    
    if (!currentUser) {
      console.log('❌ Usuário não autenticado');
      return false;
    }

    if (currentUser.role !== 'Desenvolvedor') {
      console.log(`❌ Acesso negado - Role: ${currentUser.role} (necessário: Desenvolvedor)`);
      return false;
    }

    console.log('✅ Acesso aos logs autorizado para Desenvolvedor');
    return true;
  }

  // === REGISTRO DE ATIVIDADES ===

  static async logActivity(activity: {
    action: string;
    description: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    oldData?: any;
    newData?: any;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    try {
      const currentUser = SimpleAuthService.getCurrentUser();
      
      if (!currentUser) {
        console.warn('⚠️ Tentativa de log sem usuário autenticado');
        return;
      }

      const logEntry: AuditLog = {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: activity.action,
        description: activity.description,
        targetType: activity.targetType,
        targetId: activity.targetId,
        targetName: activity.targetName,
        oldData: activity.oldData,
        newData: activity.newData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'N/A', // Em produção, seria obtido do servidor
        sessionId: this.sessionId,
        severity: activity.severity || 'low',
        repository: 'SistemaRH'
      };

      // Obter logs existentes
      const logs = await this.getStoredLogs();
      logs.push(logEntry);

      // Manter apenas os últimos 10000 registros
      if (logs.length > 10000) {
        logs.splice(0, logs.length - 10000);
      }

      // Salvar no GitHub
      await GitHubDataService.saveUserActivityLog(logEntry);

      console.log(`📝 Log registrado: ${activity.action} por ${currentUser.name}`);
    } catch (error) {
      console.error('❌ Erro ao registrar log:', error);
    }
  }

  // === OBTENÇÃO DE LOGS (APENAS DESENVOLVEDOR) ===

  static async getAllLogs(): Promise<AuditLog[]> {
    if (!this.canAccessLogs()) {
      throw new Error('Acesso negado: Apenas desenvolvedores podem acessar os logs');
    }

    try {
      console.log('📊 Carregando logs de auditoria...');
      return await this.getStoredLogs();
    } catch (error) {
      console.error('❌ Erro ao carregar logs:', error);
      return [];
    }
  }

  private static async getStoredLogs(): Promise<AuditLog[]> {
    try {
      const file = await GitHubDataService.getUserFile('user-activities.json');
      return file?.content || [];
    } catch (error) {
      console.error('❌ Erro ao buscar logs armazenados:', error);
      return [];
    }
  }

  // === ESTATÍSTICAS DE AUDITORIA ===

  static async getAuditStats(): Promise<AuditStats> {
    if (!this.canAccessLogs()) {
      throw new Error('Acesso negado: Apenas desenvolvedores podem acessar estatísticas');
    }

    try {
      const logs = await this.getStoredLogs();
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats: AuditStats = {
        totalLogs: logs.length,
        todayLogs: logs.filter(log => new Date(log.timestamp) >= today).length,
        weekLogs: logs.filter(log => new Date(log.timestamp) >= weekAgo).length,
        monthLogs: logs.filter(log => new Date(log.timestamp) >= monthAgo).length,
        criticalLogs: logs.filter(log => log.severity === 'critical').length,
        userActions: {},
        actionTypes: {},
        lastActivity: logs.length > 0 ? logs[logs.length - 1].timestamp : 'Nenhuma'
      };

      // Contar ações por usuário
      logs.forEach(log => {
        const key = `${log.userName} (${log.userRole})`;
        stats.userActions[key] = (stats.userActions[key] || 0) + 1;
      });

      // Contar tipos de ação
      logs.forEach(log => {
        stats.actionTypes[log.action] = (stats.actionTypes[log.action] || 0) + 1;
      });

      console.log('📊 Estatísticas calculadas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      throw error;
    }
  }

  // === FILTROS DE LOGS ===

  static async getLogsByUser(userId: string): Promise<AuditLog[]> {
    if (!this.canAccessLogs()) {
      throw new Error('Acesso negado');
    }

    const logs = await this.getStoredLogs();
    return logs.filter(log => log.userId === userId);
  }

  static async getLogsByAction(action: string): Promise<AuditLog[]> {
    if (!this.canAccessLogs()) {
      throw new Error('Acesso negado');
    }

    const logs = await this.getStoredLogs();
    return logs.filter(log => log.action === action);
  }

  static async getLogsByDateRange(startDate: string, endDate: string): Promise<AuditLog[]> {
    if (!this.canAccessLogs()) {
      throw new Error('Acesso negado');
    }

    const logs = await this.getStoredLogs();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });
  }

  static async getCriticalLogs(): Promise<AuditLog[]> {
    if (!this.canAccessLogs()) {
      throw new Error('Acesso negado');
    }

    const logs = await this.getStoredLogs();
    return logs.filter(log => log.severity === 'critical');
  }

  // === LIMPEZA DE LOGS ===

  static async clearOldLogs(daysToKeep: number = 90): Promise<boolean> {
    if (!this.canAccessLogs()) {
      throw new Error('Acesso negado');
    }

    try {
      const logs = await this.getStoredLogs();
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const filteredLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
      
      const removedCount = logs.length - filteredLogs.length;
      
      if (removedCount > 0) {
        // Salvar logs filtrados
        const currentFile = await GitHubDataService.getUserFile('user-activities.json');
        await GitHubDataService.saveUserFile(
          'user-activities.json',
          filteredLogs,
          `Limpeza de logs antigos - removidos ${removedCount} registros`,
          currentFile?.sha
        );

        console.log(`🗑️ ${removedCount} logs antigos removidos`);
        
        // Registrar a ação de limpeza
        await this.logActivity({
          action: 'clean_logs',
          description: `Limpeza de logs: ${removedCount} registros removidos (mantidos últimos ${daysToKeep} dias)`,
          severity: 'medium'
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar logs:', error);
      return false;
    }
  }

  // === EXPORTAÇÃO DE LOGS ===

  static async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (!this.canAccessLogs()) {
      throw new Error('Acesso negado');
    }

    const logs = await this.getStoredLogs();
    
    if (format === 'csv') {
      const headers = [
        'ID', 'Timestamp', 'Usuário', 'Role', 'Ação', 'Descrição', 
        'Tipo Alvo', 'ID Alvo', 'Nome Alvo', 'Severidade', 'User Agent'
      ];
      
      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          log.timestamp,
          log.userName,
          log.userRole,
          log.action,
          `"${log.description}"`,
          log.targetType || '',
          log.targetId || '',
          log.targetName || '',
          log.severity,
          `"${log.userAgent}"`
        ].join(','))
      ].join('\n');

      return csvContent;
    }

    return JSON.stringify(logs, null, 2);
  }

  // === LOGS PREDEFINIDOS PARA AÇÕES COMUNS ===

  static async logLogin(userName: string): Promise<void> {
    await this.logActivity({
      action: 'login',
      description: `Login realizado por ${userName}`,
      severity: 'low'
    });
  }

  static async logLogout(userName: string): Promise<void> {
    await this.logActivity({
      action: 'logout',
      description: `Logout realizado por ${userName}`,
      severity: 'low'
    });
  }

  static async logUserCreate(newUserName: string, newUserEmail: string): Promise<void> {
    await this.logActivity({
      action: 'create_user',
      description: `Usuário ${newUserName} (${newUserEmail}) foi criado`,
      targetType: 'user',
      targetName: newUserName,
      severity: 'medium'
    });
  }

  static async logUserUpdate(targetUserName: string, changes: any): Promise<void> {
    await this.logActivity({
      action: 'update_user',
      description: `Usuário ${targetUserName} foi atualizado`,
      targetType: 'user',
      targetName: targetUserName,
      newData: changes,
      severity: 'medium'
    });
  }

  static async logUserDelete(targetUserName: string): Promise<void> {
    await this.logActivity({
      action: 'delete_user',
      description: `Usuário ${targetUserName} foi deletado`,
      targetType: 'user',
      targetName: targetUserName,
      severity: 'critical'
    });
  }

  static async logCandidateCreate(candidateName: string): Promise<void> {
    await this.logActivity({
      action: 'create_candidate',
      description: `Candidato ${candidateName} foi criado`,
      targetType: 'candidate',
      targetName: candidateName,
      severity: 'low'
    });
  }

  static async logCandidateUpdate(candidateName: string, changes: any): Promise<void> {
    await this.logActivity({
      action: 'update_candidate',
      description: `Candidato ${candidateName} foi atualizado`,
      targetType: 'candidate',
      targetName: candidateName,
      newData: changes,
      severity: 'low'
    });
  }

  static async logSystemAccess(area: string): Promise<void> {
    await this.logActivity({
      action: 'system_access',
      description: `Acesso à área do sistema: ${area}`,
      targetType: 'system',
      targetName: area,
      severity: 'low'
    });
  }

  static async logDataExport(dataType: string): Promise<void> {
    await this.logActivity({
      action: 'data_export',
      description: `Exportação de dados: ${dataType}`,
      targetType: 'data',
      targetName: dataType,
      severity: 'medium'
    });
  }

  static async logSecurityEvent(event: string, details: string): Promise<void> {
    await this.logActivity({
      action: 'security_event',
      description: `Evento de segurança: ${event} - ${details}`,
      targetType: 'security',
      targetName: event,
      severity: 'critical'
    });
  }
}