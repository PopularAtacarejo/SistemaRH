# 🔄 Configuração - Repositórios Separados

## 📋 Nova Arquitetura de Dados

O sistema agora utiliza **dois repositórios GitHub separados** para melhor organização e segurança:

### 🔐 Repositório de Dados de Usuários
- **URL**: https://github.com/PopularAtacarejo/DadosSistemaRH
- **Token**: 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
- **Nome do Token**: DADOS2
- **Finalidade**: Dados sensíveis de usuários, comentários sobre usuários, alterações de perfil

### 📊 Repositório de Dados de Candidatos/Vagas  
- **URL**: https://github.com/PopularAtacarejo/VagasPopular
- **Token**: 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
- **Nome do Token**: CONSULTARVAGAS
- **Arquivo Principal**: dados.json
- **Finalidade**: Dados de candidatos, vagas, currículos, comentários sobre candidatos

## 🗂️ Estrutura de Arquivos por Repositório

### DadosSistemaRH (Dados de Usuários)
```
DadosSistemaRH/
├── usuarios.json                 # Dados dos usuários do sistema
├── user-activities.json          # Log de atividades dos usuários
├── user-comments.json            # Comentários sobre usuários
├── user-profile-changes.json     # Histórico de alterações de perfil
├── password-resets.json          # Tokens de recuperação de senha
└── user-audit-log.json          # Auditoria específica de usuários
```

### VagasPopular (Dados de Candidatos)
```
VagasPopular/
├── dados.json                    # Dados dos candidatos
├── comentarios.json              # Comentários sobre candidatos
├── lembretes.json               # Lembretes para candidatos
├── mentions.json                # Menções nos comentários
├── mention-notifications.json   # Notificações de menções
├── audit-log.json              # Auditoria geral do sistema
└── uploads/                     # Currículos em PDF
    ├── curriculo1.pdf
    └── curriculo2.pdf
```

## 🔧 Configuração de Variáveis de Ambiente

### Arquivo .env Atualizado
```bash
# === CONFIGURAÇÃO DE REPOSITÓRIOS ===

# Repositório para dados de USUÁRIOS (DadosSistemaRH) - Hardcoded
# Token DADOS2: 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
# Este token está hardcoded no código por segurança

# Repositório para dados de CANDIDATOS/VAGAS (VagasPopular) - Hardcoded  
# Token CONSULTARVAGAS: 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
# Este token está hardcoded no código para acessar dados.json

# Ambos os tokens estão configurados automaticamente no código
# Não é necessário configurar via variáveis de ambiente

# === CONFIGURAÇÕES DE SEGURANÇA ===
VITE_PASSWORD_SALT=sua_chave_secreta_super_complexa_aqui_2024
VITE_JWT_SECRET=jwt_secret_key_muito_complexa_para_tokens

# === CONFIGURAÇÕES DO SISTEMA ===
VITE_APP_VERSION=2.1.0
VITE_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.github.com

# === FEATURE FLAGS ===
VITE_ENABLE_AUDIT=true
VITE_ENABLE_MENTIONS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_PWA=true
VITE_ENABLE_DUAL_REPO=true

# === CONFIGURAÇÕES DE PERFORMANCE ===
VITE_CACHE_DURATION=30000
VITE_MAX_AUDIT_ENTRIES=10000
VITE_MAX_NOTIFICATIONS=2000
VITE_MAX_USER_ACTIVITIES=5000
```

## 🔄 Migração de Dados Existentes

### Script de Migração
```javascript
// scripts/migrate-to-dual-repos.js
import { GitHubService } from '../src/services/githubService.js';
import { GitHubDataService } from '../src/services/githubDataService.js';

async function migrateToDualRepos() {
  console.log('🔄 Iniciando migração para repositórios separados...');
  
  try {
    // 1. Migrar dados de usuários
    console.log('📋 Migrando dados de usuários...');
    const users = await GitHubService.getUsersData();
    
    if (users.length > 0) {
      // Adicionar metadados de migração
      const usersWithMetadata = users.map(user => ({
        ...user,
        migratedAt: new Date().toISOString(),
        migratedFrom: 'VagasPopular',
        repository: 'DadosSistemaRH'
      }));
      
      await GitHubDataService.saveUsersData(usersWithMetadata);
      console.log(`✅ ${users.length} usuários migrados para DadosSistemaRH`);
    }

    // 2. Criar estrutura inicial de arquivos no repositório de usuários
    console.log('📁 Criando estrutura inicial...');
    
    const initialFiles = [
      { name: 'user-activities.json', content: [] },
      { name: 'user-comments.json', content: [] },
      { name: 'user-profile-changes.json', content: [] },
      { name: 'password-resets.json', content: [] }
    ];

    for (const file of initialFiles) {
      try {
        await GitHubDataService.saveUserFile(
          file.name,
          file.content,
          `Criação inicial do arquivo ${file.name} - ${new Date().toISOString()}`
        );
        console.log(`✅ Arquivo ${file.name} criado`);
      } catch (error) {
        if (error.message.includes('422')) {
          console.log(`ℹ️ Arquivo ${file.name} já existe`);
        } else {
          console.error(`❌ Erro ao criar ${file.name}:`, error);
        }
      }
    }

    // 3. Verificar integridade
    console.log('🔍 Verificando integridade...');
    const connections = await GitHubDataService.checkConnections();
    
    console.log('Conexão repositório usuários:', connections.userRepo.available ? '✅' : '❌');
    console.log('Conexão repositório candidatos:', connections.candidateRepo.available ? '✅' : '❌');

    if (connections.userRepo.available && connections.candidateRepo.available) {
      console.log('🎉 Migração concluída com sucesso!');
      console.log('📊 Estatísticas dos repositórios:');
      
      const stats = await GitHubDataService.getRepositoryStats();
      console.log(`- Usuários: ${stats.userRepo.files} arquivos`);
      console.log(`- Candidatos: ${stats.candidateRepo.files} arquivos`);
    } else {
      console.error('❌ Problemas de conectividade detectados');
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Executar migração
migrateToDualRepos().catch(console.error);
```

## 🔐 Segurança e Permissões

### Configuração dos Tokens
```typescript
// src/config/github-tokens.ts
export const GITHUB_TOKENS = {
  // Token DADOS2 para dados de usuários (hardcoded por segurança)
  USER_DATA: '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',
  
  // Token CONSULTARVAGAS para dados de candidatos/vagas (hardcoded)
  CANDIDATE_DATA: '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'
};

export const REPOSITORIES = {
  USER_DATA: {
    owner: 'PopularAtacarejo',
    repo: 'DadosSistemaRH',
    branch: 'main'
  },
  CANDIDATE_DATA: {
    owner: 'PopularAtacarejo', 
    repo: 'VagasPopular',
    branch: 'main'
  }
};
```

### Permissões Necessárias
```yaml
# Permissões para Token DADOS2 (usuários - DadosSistemaRH)
permissions:
  - repo (acesso completo ao repositório DadosSistemaRH)
  - read:user (leitura de dados do usuário)
  - user:email (acesso aos emails)

# Permissões para Token CONSULTARVAGAS (candidatos/vagas - VagasPopular)
permissions:
  - repo (acesso completo ao repositório VagasPopular)
  - read:user (leitura de dados do usuário)
  - contents:read (leitura do arquivo dados.json)
  - contents:write (escrita no arquivo dados.json)
```

## 📊 Monitoramento da Nova Estrutura

### Dashboard de Status
```typescript
// src/components/RepositoryStatus.tsx
export const RepositoryStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    const checkStatus = async () => {
      const connections = await GitHubDataService.checkConnections();
      const stats = await GitHubDataService.getRepositoryStats();
      
      setStatus({
        connections,
        stats,
        lastCheck: new Date().toISOString()
      });
    };
    
    checkStatus();
    
    // Verificar a cada 5 minutos
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div>Carregando status...</div>;

  return (
    <div className="repository-status">
      <h3>Status dos Repositórios</h3>
      
      <div className="repo-card">
        <h4>🔐 Dados de Usuários (DadosSistemaRH)</h4>
        <p>Status: {status.connections.userRepo.available ? '✅ Online' : '❌ Offline'}</p>
        <p>Arquivos: {status.stats.userRepo.files}</p>
        <p>Última atualização: {status.stats.userRepo.lastUpdate}</p>
      </div>
      
      <div className="repo-card">
        <h4>📊 Dados de Candidatos (VagasPopular)</h4>
        <p>Status: {status.connections.candidateRepo.available ? '✅ Online' : '❌ Offline'}</p>
        <p>Arquivos: {status.stats.candidateRepo.files}</p>
        <p>Última atualização: {status.stats.candidateRepo.lastUpdate}</p>
      </div>
      
      <p>Última verificação: {new Date(status.lastCheck).toLocaleString('pt-BR')}</p>
    </div>
  );
};
```

## 🔄 Fluxo de Dados Atualizado

### Operações com Usuários
```mermaid
graph TD
    A[Ação do Usuário] --> B{Tipo de Operação}
    B -->|Criar/Editar/Deletar Usuário| C[UserService]
    C --> D[GitHubDataService]
    D --> E[DadosSistemaRH]
    C --> F[AuditService]
    F --> G[audit-log.json em VagasPopular]
    E --> H[Sucesso]
```

### Operações com Candidatos
```mermaid
graph TD
    A[Ação do Candidato] --> B{Tipo de Operação}
    B -->|Candidato/Comentário/Status| C[CandidateService]
    C --> D[GitHubService Original]
    D --> E[VagasPopular]
    C --> F[MentionService]
    F --> G[mentions.json em VagasPopular]
    E --> H[Sucesso]
```

## 🚀 Deploy com Nova Estrutura

### Netlify
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  # Todos os tokens estão hardcoded no código por segurança
  # Token DADOS2 e CONSULTARVAGAS estão configurados automaticamente
  # Não são necessárias variáveis de ambiente para tokens

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_ENABLE_DUAL_REPO": "true",
    "VITE_ENVIRONMENT": "production"
  }
}
```

## 📋 Checklist de Implementação

### Fase 1 - Configuração Básica ✅
- [x] Criar GitHubDataService
- [x] Atualizar UserService para usar repositório específico
- [x] Configurar token DADOS2 hardcoded
- [x] Separar operações de usuários e candidatos

### Fase 2 - Migração de Dados
- [ ] Executar script de migração
- [ ] Verificar integridade dos dados
- [ ] Testar operações CRUD em ambos repositórios
- [ ] Validar logs de auditoria

### Fase 3 - Monitoramento
- [ ] Implementar dashboard de status
- [ ] Configurar alertas de conectividade
- [ ] Teste de failover entre repositórios
- [ ] Documentação para usuários finais

## 🆘 Troubleshooting

### Problemas Comuns

**1. Erro de Permissão no Token DADOS2**
```bash
Error: GitHub API error: 403 Forbidden
```
Solução: Verificar se o token tem permissões `repo` completas.

**2. Repositório não Encontrado**
```bash
Error: GitHub API error: 404 Not Found
```
Solução: Verificar se o repositório DadosSistemaRH foi criado e está acessível.

**3. Conflito de Dados**
```bash
Error: GitHub API error: 409 Conflict
```
Solução: Fazer pull das últimas mudanças antes de salvar.

### Comandos de Diagnóstico
```bash
# Testar conectividade
npm run test:github-connection

# Verificar integridade de dados
npm run verify:data-integrity

# Executar migração
npm run migrate:dual-repos

# Backup de emergência
npm run backup:all-repos
```

## 📞 Suporte

Para questões sobre a nova estrutura:
- **Desenvolvedor**: Jeferson
- **Email**: jeferson@sistemahr.com
- **WhatsApp**: (82) 99915-8412

---

**✅ A separação de repositórios garante maior segurança e organização dos dados!**