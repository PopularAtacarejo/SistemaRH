export interface Mention {
  id: string;
  userId: string;
  userName: string;
  commentId: string;
  candidateId: string;
  mentionedBy: string;
  timestamp: string;
  read: boolean;
}

export interface MentionNotification {
  id: string;
  mentionId: string;
  userId: string;
  type: 'mention';
  title: string;
  message: string;
  candidateName: string;
  candidateId: string;
  commentId: string;
  read: boolean;
  createdAt: string;
}

export class MentionService {
  private static mentionRegex = /@(\w+)/g;

  static extractMentions(text: string): string[] {
    const mentions: string[] = [];
    let match;
    
    // Reset regex para evitar problemas com múltiplas execuções
    this.mentionRegex.lastIndex = 0;
    
    while ((match = this.mentionRegex.exec(text)) !== null) {
      const username = match[1];
      if (!mentions.includes(username)) {
        mentions.push(username);
      }
    }
    
    return mentions;
  }

  static highlightMentions(text: string): string {
    return text.replace(this.mentionRegex, '<span class="mention" data-username="$1">@$1</span>');
  }

  static async processMentions(
    commentId: string,
    candidateId: string,
    commentText: string,
    authorId: string,
    authorName: string
  ): Promise<void> {
    try {
      const mentions = this.extractMentions(commentText);
      
      if (mentions.length === 0) return;

      // Buscar usuários mencionados
      const { UserService } = await import('./userService');
      const validMentions: string[] = [];

      for (const username of mentions) {
        const user = await UserService.getUserByName(username);
        if (user && user.id !== authorId) {
          validMentions.push(username);
          
          // Criar menção
          await this.createMention({
            commentId,
            candidateId,
            mentionedUserId: user.id,
            mentionedUserName: user.name,
            mentionedBy: authorName
          });

          // Criar notificação
          await this.createMentionNotification({
            userId: user.id,
            mentionedBy: authorName,
            candidateId,
            commentId,
            commentText
          });
        }
      }

      console.log(`✅ ${validMentions.length} menções processadas`);
    } catch (error) {
      console.error('❌ Erro ao processar menções:', error);
    }
  }

  static async createMention(data: {
    commentId: string;
    candidateId: string;
    mentionedUserId: string;
    mentionedUserName: string;
    mentionedBy: string;
  }): Promise<void> {
    try {
      const mention: Mention = {
        id: crypto.randomUUID(),
        userId: data.mentionedUserId,
        userName: data.mentionedUserName,
        commentId: data.commentId,
        candidateId: data.candidateId,
        mentionedBy: data.mentionedBy,
        timestamp: new Date().toISOString(),
        read: false
      };

      await this.saveMention(mention);
    } catch (error) {
      console.error('❌ Erro ao criar menção:', error);
      throw error;
    }
  }

  static async createMentionNotification(data: {
    userId: string;
    mentionedBy: string;
    candidateId: string;
    commentId: string;
    commentText: string;
  }): Promise<void> {
    try {
      // Buscar dados do candidato
      const { CandidateService } = await import('./candidateService');
      const candidates = await CandidateService.getAllCandidates();
      const candidate = candidates.find(c => c.id === data.candidateId);

      if (!candidate) return;

      const notification: MentionNotification = {
        id: crypto.randomUUID(),
        mentionId: crypto.randomUUID(),
        userId: data.userId,
        type: 'mention',
        title: `Você foi mencionado por ${data.mentionedBy}`,
        message: `${data.mentionedBy} mencionou você em um comentário sobre ${candidate.nome}`,
        candidateName: candidate.nome,
        candidateId: data.candidateId,
        commentId: data.commentId,
        read: false,
        createdAt: new Date().toISOString()
      };

      await this.saveNotification(notification);

      // Log de auditoria
      const { AuditService } = await import('./auditService');
      await AuditService.logAction({
        userId: data.userId,
        userName: data.mentionedBy,
        type: 'create',
        resourceType: 'system',
        resourceId: notification.id,
        metadata: {
          type: 'mention_notification',
          candidateId: data.candidateId,
          mentionedUser: data.userId
        }
      });

    } catch (error) {
      console.error('❌ Erro ao criar notificação de menção:', error);
      throw error;
    }
  }

  static async getUserMentions(userId: string, unreadOnly = false): Promise<Mention[]> {
    try {
      const { GitHubService } = await import('./githubService');
      const mentions: Mention[] = await GitHubService.getRawFile('mentions.json') || [];
      
      return mentions
        .filter(mention => 
          mention.userId === userId && 
          (!unreadOnly || !mention.read)
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('❌ Erro ao buscar menções do usuário:', error);
      return [];
    }
  }

  static async getMentionNotifications(userId: string, unreadOnly = false): Promise<MentionNotification[]> {
    try {
      const { GitHubService } = await import('./githubService');
      const notifications: MentionNotification[] = await GitHubService.getRawFile('mention-notifications.json') || [];
      
      return notifications
        .filter(notification => 
          notification.userId === userId && 
          (!unreadOnly || !notification.read)
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('❌ Erro ao buscar notificações de menção:', error);
      return [];
    }
  }

  static async markMentionAsRead(mentionId: string): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      let mentions: Mention[] = await GitHubService.getRawFile('mentions.json') || [];
      
      mentions = mentions.map(mention => 
        mention.id === mentionId ? { ...mention, read: true } : mention
      );

      await this.saveMentions(mentions);
    } catch (error) {
      console.error('❌ Erro ao marcar menção como lida:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      let notifications: MentionNotification[] = await GitHubService.getRawFile('mention-notifications.json') || [];
      
      notifications = notifications.map(notification => 
        notification.id === notificationId ? { ...notification, read: true } : notification
      );

      await this.saveNotifications(notifications);
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  static async getAvailableUsers(): Promise<Array<{ id: string; name: string; email: string }>> {
    try {
      const { UserService } = await import('./userService');
      const users = await UserService.getAllUsers();
      
      return users
        .filter(user => user.isActive)
        .map(user => ({
          id: user.id,
          name: user.name,
          email: user.email
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('❌ Erro ao buscar usuários disponíveis:', error);
      return [];
    }
  }

  static async getMentionStats(userId?: string): Promise<{
    totalMentions: number;
    unreadMentions: number;
    mentionsByUser: Record<string, number>;
    mentionsPerDay: Record<string, number>;
  }> {
    try {
      const { GitHubService } = await import('./githubService');
      let mentions: Mention[] = await GitHubService.getRawFile('mentions.json') || [];
      
      if (userId) {
        mentions = mentions.filter(m => m.userId === userId);
      }

      const stats = {
        totalMentions: mentions.length,
        unreadMentions: mentions.filter(m => !m.read).length,
        mentionsByUser: {} as Record<string, number>,
        mentionsPerDay: {} as Record<string, number>
      };

      mentions.forEach(mention => {
        // Contar por usuário que mencionou
        stats.mentionsByUser[mention.mentionedBy] = (stats.mentionsByUser[mention.mentionedBy] || 0) + 1;
        
        // Contar por dia
        const day = mention.timestamp.split('T')[0];
        stats.mentionsPerDay[day] = (stats.mentionsPerDay[day] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Erro ao gerar estatísticas de menções:', error);
      return {
        totalMentions: 0,
        unreadMentions: 0,
        mentionsByUser: {},
        mentionsPerDay: {}
      };
    }
  }

  private static async saveMention(mention: Mention): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      let mentions: Mention[] = await GitHubService.getRawFile('mentions.json') || [];
      
      mentions.push(mention);
      
      await this.saveMentions(mentions);
    } catch (error) {
      console.error('❌ Erro ao salvar menção:', error);
      throw error;
    }
  }

  private static async saveMentions(mentions: Mention[]): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      
      // Manter apenas os últimos 5000 registros
      if (mentions.length > 5000) {
        mentions = mentions
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5000);
      }

      const file = await GitHubService.getFile('mentions.json').catch(() => null);
      await GitHubService.saveFile(
        'mentions.json',
        mentions,
        `Atualização de menções - ${new Date().toISOString()}`,
        file?.sha
      );
    } catch (error) {
      console.error('❌ Erro ao salvar menções:', error);
      throw error;
    }
  }

  private static async saveNotification(notification: MentionNotification): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      let notifications: MentionNotification[] = await GitHubService.getRawFile('mention-notifications.json') || [];
      
      notifications.push(notification);
      
      await this.saveNotifications(notifications);
    } catch (error) {
      console.error('❌ Erro ao salvar notificação:', error);
      throw error;
    }
  }

  private static async saveNotifications(notifications: MentionNotification[]): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      
      // Manter apenas os últimos 2000 registros
      if (notifications.length > 2000) {
        notifications = notifications
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2000);
      }

      const file = await GitHubService.getFile('mention-notifications.json').catch(() => null);
      await GitHubService.saveFile(
        'mention-notifications.json',
        notifications,
        `Atualização de notificações de menção - ${new Date().toISOString()}`,
        file?.sha
      );
    } catch (error) {
      console.error('❌ Erro ao salvar notificações:', error);
      throw error;
    }
  }
}