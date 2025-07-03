export class UserSecurityService {
  // Simular hash de senha (em produção, usar bcrypt)
  static async hashPassword(password: string): Promise<string> {
    // Para este exemplo, vamos usar uma implementação simples
    // Em produção, use bcrypt ou similar
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_secret_key');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hash;
  }

  static generateSecureToken(): string {
    return crypto.randomUUID();
  }

  static generateResetToken(): string {
    return crypto.randomUUID() + '-' + Date.now();
  }
}

export class UserValidationService {
  static validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      return { valid: false, error: 'Email é obrigatório' };
    }
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Formato de email inválido' };
    }
    return { valid: true };
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Senha é obrigatória');
      return { valid: false, errors };
    }
    
    if (password.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Pelo menos 1 letra maiúscula');
    if (!/[a-z]/.test(password)) errors.push('Pelo menos 1 letra minúscula');
    if (!/\d/.test(password)) errors.push('Pelo menos 1 número');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Pelo menos 1 caractere especial');
    }

    return { valid: errors.length === 0, errors };
  }

  static validateName(name: string): { valid: boolean; error?: string } {
    if (!name || !name.trim()) {
      return { valid: false, error: 'Nome é obrigatório' };
    }
    if (name.trim().length < 2) {
      return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
    }
    if (name.trim().length > 100) {
      return { valid: false, error: 'Nome deve ter no máximo 100 caracteres' };
    }
    return { valid: true };
  }

  static validateRole(role: string): { valid: boolean; error?: string } {
    const validRoles = ['Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH', 'Convidado'];
    if (!role) {
      return { valid: false, error: 'Nível de acesso é obrigatório' };
    }
    if (!validRoles.includes(role)) {
      return { valid: false, error: 'Nível de acesso inválido' };
    }
    return { valid: true };
  }

  static validateDepartment(department: string): { valid: boolean; error?: string } {
    if (!department || !department.trim()) {
      return { valid: false, error: 'Departamento é obrigatório' };
    }
    return { valid: true };
  }
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export class PasswordResetService {
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Importar UserService dinamicamente para evitar dependência circular
      const { UserService } = await import('./userService');
      
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        // Por segurança, não revelamos se o email existe ou não
        return { 
          success: true, 
          message: 'Se o email existir em nosso sistema, você receberá instruções para redefinir sua senha.' 
        };
      }

      const resetToken = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora

      // Salvar token temporário no GitHub
      await this.saveResetToken(user.id, resetToken, expiresAt);
      
      // Em um ambiente real, enviar email aqui
      console.log(`Password reset token for ${email}: ${resetToken}`);
      
      return { 
        success: true, 
        message: 'Instruções para redefinir a senha foram enviadas para seu email.' 
      };
    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      return { 
        success: false, 
        message: 'Erro interno. Tente novamente mais tarde.' 
      };
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validar nova senha
      const passwordValidation = UserValidationService.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: 'Senha inválida: ' + passwordValidation.errors.join(', ')
        };
      }

      // Verificar token
      const resetTokenData = await this.getResetToken(token);
      if (!resetTokenData) {
        return { success: false, message: 'Token inválido ou expirado.' };
      }

      if (resetTokenData.used) {
        return { success: false, message: 'Token já foi utilizado.' };
      }

      if (new Date() > new Date(resetTokenData.expiresAt)) {
        return { success: false, message: 'Token expirado.' };
      }

      // Importar UserService dinamicamente
      const { UserService } = await import('./userService');
      
      // Hash da nova senha
      const hashedPassword = await UserSecurityService.hashPassword(newPassword);
      
      // Atualizar senha do usuário
      await UserService.updateUser(resetTokenData.userId, { password: hashedPassword });
      
      // Marcar token como usado
      await this.markTokenAsUsed(token);

      return { success: true, message: 'Senha redefinida com sucesso!' };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return { success: false, message: 'Erro interno. Tente novamente mais tarde.' };
    }
  }

  private static generateResetToken(): string {
    return UserSecurityService.generateResetToken();
  }

  private static async saveResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      
      const resetTokenData: PasswordResetToken = {
        id: crypto.randomUUID(),
        userId,
        token,
        expiresAt: expiresAt.toISOString(),
        used: false,
        createdAt: new Date().toISOString()
      };

      // Buscar tokens existentes
      let tokens: PasswordResetToken[] = [];
      try {
        tokens = await GitHubService.getRawFile('password-resets.json') || [];
      } catch (error) {
        // Arquivo não existe ainda, criar novo
      }

      // Adicionar novo token
      tokens.push(resetTokenData);

      // Limpar tokens expirados
      tokens = tokens.filter(t => new Date(t.expiresAt) > new Date());

      // Salvar
      await GitHubService.saveFile(
        'password-resets.json',
        tokens,
        `Token de reset de senha criado - ${new Date().toISOString()}`
      );
    } catch (error) {
      console.error('Erro ao salvar token de reset:', error);
      throw error;
    }
  }

  private static async getResetToken(token: string): Promise<PasswordResetToken | null> {
    try {
      const { GitHubService } = await import('./githubService');
      const tokens: PasswordResetToken[] = await GitHubService.getRawFile('password-resets.json') || [];
      
      return tokens.find(t => t.token === token) || null;
    } catch (error) {
      console.error('Erro ao buscar token de reset:', error);
      return null;
    }
  }

  private static async markTokenAsUsed(token: string): Promise<void> {
    try {
      const { GitHubService } = await import('./githubService');
      let tokens: PasswordResetToken[] = await GitHubService.getRawFile('password-resets.json') || [];
      
      tokens = tokens.map(t => 
        t.token === token ? { ...t, used: true } : t
      );

      await GitHubService.saveFile(
        'password-resets.json',
        tokens,
        `Token de reset marcado como usado - ${new Date().toISOString()}`
      );
    } catch (error) {
      console.error('Erro ao marcar token como usado:', error);
      throw error;
    }
  }
}