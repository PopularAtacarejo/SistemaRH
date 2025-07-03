# 🛠️ Guia de Implementação das Melhorias

## 📋 Implementações Realizadas

### 1. ✅ Serviço de Segurança de Usuários
**Arquivo:** `src/services/userSecurityService.ts`

- **Hash de senhas** com SHA-256 (produção: usar bcrypt)
- **Validação robusta** de email, senha, nome, role e departamento
- **Sistema de recuperação de senha** com tokens temporários
- **Validação de força de senha** com múltiplos critérios

### 2. ✅ Sistema de Auditoria Completo
**Arquivo:** `src/services/auditService.ts`

- **Rastreamento de todas as ações** do sistema
- **Trilha de auditoria** por recurso/usuário
- **Estatísticas do sistema** com métricas detalhadas
- **Cache local** para performance
- **Métodos de conveniência** para logs específicos

### 3. ✅ Sistema de Menções Avançado
**Arquivo:** `src/services/mentionService.ts`

- **Detecção automática** de menções (@username)
- **Notificações em tempo real** para usuários mencionados
- **Sistema de leitura** de menções
- **Estatísticas de menções** por usuário
- **Integração com auditoria**

### 4. ✅ Melhorias no UserService
**Arquivo:** `src/services/userService.ts`

- **Método getUserByName** adicionado
- **Método getUserById** para busca por ID
- **Validações melhoradas** de email

## 🔄 Como Integrar as Melhorias

### 1. Atualizar o Sistema de Login

```typescript
// Em Login.tsx - adicionar validação robusta
import { UserValidationService, UserSecurityService } from '../services/userSecurityService';
import { AuditService } from '../services/auditService';

const handleLogin = async (email: string, password: string) => {
  try {
    // Validar email
    const emailValidation = UserValidationService.validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }

    // Autenticar com hash
    const user = await UserService.authenticateUser(email, password);
    if (user) {
      // Log de auditoria
      await AuditService.logUserAction(user.id, user.name, 'login');
      
      setUser(user);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro no login:', error);
    return false;
  }
};
```

### 2. Integrar Sistema de Menções

```typescript
// Em CandidateService.ts - atualizar addComment
import { MentionService } from '../services/mentionService';
import { AuditService } from '../services/auditService';

static async addComment(
  candidateId: string, 
  text: string, 
  author: string,
  authorId: string,
  type: 'comment' | 'status_change' = 'comment'
): Promise<void> {
  try {
    console.log(`🔄 Adicionando comentário para candidato ${candidateId}`);

    const comments = await GitHubService.getCommentsData();

    const newComment = {
      id: `comment-${Date.now()}`,
      candidateId: candidateId,
      text: text,
      author: author,
      date: new Date().toISOString(),
      type: type
    };

    comments.push(newComment);
    await GitHubService.saveCommentsData(comments);

    // Processar menções
    await MentionService.processMentions(
      newComment.id,
      candidateId,
      text,
      authorId,
      author
    );

    // Log de auditoria
    await AuditService.logCommentAction(
      authorId,
      author,
      'create',
      candidateId,
      newComment.id,
      text
    );

    this.clearCache();
    console.log('✅ Comentário adicionado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao adicionar comentário:', error);
    throw error;
  }
}
```

### 3. Integrar Auditoria em Mudanças de Status

```typescript
// Em CandidateService.ts - atualizar updateCandidateStatus
static async updateCandidateStatus(
  candidateId: string, 
  newStatus: string, 
  updatedBy: string,
  updatedById: string,
  comment?: string,
  startDate?: string
): Promise<void> {
  try {
    console.log(`🔄 Atualizando status do candidato ${candidateId} para ${newStatus}`);

    const candidates = await GitHubService.getCandidatesData();
    const candidateIndex = candidates.findIndex((c: any) => c.id === candidateId);
    
    if (candidateIndex === -1) {
      throw new Error('Candidato não encontrado');
    }

    const oldStatus = candidates[candidateIndex].status;

    // Atualizar dados do candidato
    candidates[candidateIndex] = {
      ...candidates[candidateIndex],
      status: newStatus,
      lastUpdate: new Date().toISOString(),
      updatedBy: updatedBy
    };

    if (startDate) {
      candidates[candidateIndex].startDate = startDate;
    }

    // Salvar no GitHub
    await GitHubService.saveCandidatesData(candidates);

    // Log de auditoria para mudança de status
    await AuditService.logStatusChange(
      updatedById,
      updatedBy,
      candidateId,
      oldStatus,
      newStatus
    );

    // Adicionar comentário se fornecido
    if (comment) {
      await this.addComment(candidateId, comment, updatedBy, updatedById, 'status_change');
    }

    this.clearCache();
    console.log('✅ Status atualizado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    throw error;
  }
}
```

### 4. Implementar Sistema de Notificações

```typescript
// Novo arquivo: src/services/notificationService.ts
export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'reminder' | 'status_change' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export class NotificationService {
  private static cache: Notification[] = [];
  private static listeners: ((notifications: Notification[]) => void)[] = [];

  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    // Salvar no GitHub
    await this.saveNotification(newNotification);

    // Notificar listeners (para tempo real)
    this.notifyListeners();
  }

  static async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    const notifications = await this.getAllNotifications();
    
    return notifications
      .filter(n => n.userId === userId && (!unreadOnly || !n.read))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback);
    
    // Retornar função de cleanup
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private static async saveNotification(notification: Notification): Promise<void> {
    // Implementação similar aos outros serviços
    const { GitHubService } = await import('./githubService');
    // ... salvar no GitHub
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.cache);
    });
  }
}
```

## 🎨 Componentes de Interface

### 1. Botão de Notificações no Header

```tsx
// Em Layout.tsx - adicionar botão de notificações
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import { NotificationService } from '../services/notificationService';

const [showNotifications, setShowNotifications] = useState(false);
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  if (user) {
    // Carregar notificações não lidas
    const loadUnreadCount = async () => {
      const notifications = await NotificationService.getUserNotifications(user.id, true);
      setUnreadCount(notifications.length);
    };

    loadUnreadCount();

    // Subscrever a mudanças em tempo real
    const unsubscribe = NotificationService.subscribe(() => {
      loadUnreadCount();
    });

    return unsubscribe;
  }
}, [user]);

// No JSX do header
<button
  onClick={() => setShowNotifications(true)}
  className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
>
  <Bell className="w-5 h-5" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</button>

{showNotifications && (
  <NotificationPanel
    isOpen={showNotifications}
    onClose={() => setShowNotifications(false)}
  />
)}
```

### 2. Campo de Comentário com Autocomplete de Menções

```tsx
// Componente MentionTextarea.tsx
const MentionTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{id: string, name: string}>>([]);
  const [mentionQuery, setMentionQuery] = useState('');

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Detectar se está digitando uma menção
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      
      // Buscar usuários que correspondem
      const users = await MentionService.getAvailableUsers();
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Resto da implementação...
};
```

## 📊 Integração com Dashboard

### 1. Estatísticas de Auditoria

```tsx
// No Dashboard.tsx - adicionar métricas de auditoria
const [auditStats, setAuditStats] = useState(null);

useEffect(() => {
  const loadAuditStats = async () => {
    const stats = await AuditService.getSystemStats(30);
    setAuditStats(stats);
  };

  loadAuditStats();
}, []);

// Card de estatísticas
{auditStats && (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
    <h3 className="text-lg font-semibold mb-4">Atividade do Sistema (30 dias)</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-2xl font-bold text-blue-600">{auditStats.totalActions}</p>
        <p className="text-sm text-gray-600">Total de Ações</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-green-600">
          {Object.keys(auditStats.actionsByUser).length}
        </p>
        <p className="text-sm text-gray-600">Usuários Ativos</p>
      </div>
    </div>
  </div>
)}
```

### 2. Nova Aba Kanban

```tsx
// No Dashboard.tsx - adicionar nova aba
const [activeTab, setActiveTab] = useState<'todos' | 'candidatos' | 'kanban' | 'analytics'>('todos');

// Nova aba
<button
  onClick={() => setActiveTab('kanban')}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
    activeTab === 'kanban'
      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
  }`}
>
  <LayoutGrid className="w-4 h-4" />
  Kanban
</button>

// No conteúdo
{activeTab === 'kanban' && (
  <CandidateKanban
    candidates={candidates}
    onStatusChange={handleStatusUpdate}
    onCandidateClick={openCandidateModal}
  />
)}
```

## 🔒 Implementação de Segurança

### 1. Middleware de Permissões

```typescript
// src/services/permissionService.ts
export class PermissionService {
  private static rolePermissions = {
    'Administrador': {
      candidates: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
      comments: ['create', 'read', 'update', 'delete'],
      reminders: ['create', 'read', 'update', 'delete'],
      audit: ['read'],
      export: ['data']
    },
    'Gerente RH': {
      candidates: ['create', 'read', 'update'],
      users: ['read'],
      comments: ['create', 'read', 'update'],
      reminders: ['create', 'read', 'update'],
      export: ['data']
    },
    'Analista RH': {
      candidates: ['read', 'update'],
      comments: ['create', 'read'],
      reminders: ['create', 'read']
    },
    'Assistente RH': {
      candidates: ['read'],
      comments: ['create', 'read']
    },
    'Convidado': {
      candidates: ['read']
    }
  };

  static hasPermission(userRole: string, resource: string, action: string): boolean {
    const permissions = this.rolePermissions[userRole as keyof typeof this.rolePermissions];
    if (!permissions) return false;
    
    const resourcePermissions = permissions[resource as keyof typeof permissions];
    if (!resourcePermissions) return false;
    
    return resourcePermissions.includes(action);
  }

  static requirePermission(userRole: string, resource: string, action: string): void {
    if (!this.hasPermission(userRole, resource, action)) {
      throw new Error(`Acesso negado: ${userRole} não tem permissão para ${action} em ${resource}`);
    }
  }
}
```

### 2. Hook de Permissões

```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    return PermissionService.hasPermission(user.role, resource, action);
  };

  const requirePermission = (resource: string, action: string): void => {
    if (!user) throw new Error('Usuário não autenticado');
    PermissionService.requirePermission(user.role, resource, action);
  };

  return {
    hasPermission,
    requirePermission,
    canCreateUsers: hasPermission('users', 'create'),
    canEditUsers: hasPermission('users', 'update'),
    canDeleteUsers: hasPermission('users', 'delete'),
    canViewAudit: hasPermission('audit', 'read'),
    canExportData: hasPermission('export', 'data')
  };
};
```

## 📱 PWA e Funcionalidades Offline

### 1. Service Worker Básico

```javascript
// public/sw.js
const CACHE_NAME = 'hr-system-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
```

### 2. Manifest PWA

```json
// public/manifest.json
{
  "short_name": "Sistema RH",
  "name": "Sistema RH Moderno",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

## 🎯 Próximos Passos

### Fase 1 - Implementação Imediata (1-2 semanas)
1. ✅ Integrar novos serviços no Dashboard existente
2. ✅ Adicionar validações de segurança no login
3. ✅ Implementar sistema de menções nos comentários
4. ✅ Adicionar logs de auditoria nas principais ações

### Fase 2 - Melhorias de Interface (2-3 semanas)
1. 🔄 Criar componente de notificações
2. 🔄 Implementar visualização Kanban
3. 🔄 Adicionar sistema de permissões na UI
4. 🔄 Criar painel de auditoria

### Fase 3 - Recursos Avançados (3-4 semanas)
1. 🔄 PWA com funcionalidade offline
2. 🔄 Integração com calendário
3. 🔄 Relatórios avançados
4. 🔄 API para integrações externas

## 📋 Checklist de Implementação

- [x] Serviço de segurança de usuários
- [x] Sistema de auditoria
- [x] Serviço de menções
- [x] Melhorias no UserService
- [ ] Integração com Dashboard
- [ ] Componente de notificações
- [ ] Visualização Kanban
- [ ] Sistema de permissões
- [ ] PWA básico
- [ ] Testes automatizados

---

**Nota**: Este documento serve como guia para implementar as melhorias de forma incremental, mantendo o sistema funcionando durante todo o processo de upgrade.