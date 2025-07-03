# 🧪 Teste do Sistema RH Moderno - Repositórios Separados

## 🎯 Objetivo dos Testes

Validar que todas as funcionalidades estão funcionando corretamente com a nova arquitetura de repositórios separados.

## ⚙️ Pré-requisitos

### 1. Verificar Repositórios
- ✅ Repositório DadosSistemaRH criado
- ✅ Token DADOS2 configurado
- ✅ Permissões adequadas no token

### 2. Configurar Ambiente Local
```bash
# Clone o projeto
git clone https://github.com/PopularAtacarejo/VagasPopular
cd VagasPopular

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com o token de candidatos (se necessário)
```

## 🧪 Bateria de Testes

### Teste 1: Conectividade dos Repositórios
```javascript
// Testar no console do navegador
import { GitHubDataService } from './src/services/githubDataService.js';

// Verificar conexões
const connections = await GitHubDataService.checkConnections();
console.log('Conexões:', connections);

// Deve retornar:
// userRepo: { available: true }
// candidateRepo: { available: true }
```

### Teste 2: Operações com Usuários (Repositório DadosSistemaRH)
```javascript
import { UserService } from './src/services/userService.js';

// 1. Buscar usuários existentes
const users = await UserService.getAllUsers();
console.log('Usuários carregados:', users.length);

// 2. Criar novo usuário
await UserService.createUser({
  name: 'Teste Usuario',
  email: 'teste@empresa.com',
  role: 'Analista',
  department: 'RH',
  password: 'MinhaSenh@123',
  createdBy: 'Jeferson'
});

console.log('✅ Usuário criado com sucesso');

// 3. Verificar no repositório DadosSistemaRH
// - Acessar: https://github.com/PopularAtacarejo/DadosSistemaRH
// - Arquivo usuarios.json deve ter o novo usuário
```

### Teste 3: Sistema de Auditoria
```javascript
import { AuditService } from './src/services/auditService.js';

// Registrar ação de teste
await AuditService.logAction({
  userId: '1',
  userName: 'Jeferson',
  type: 'test',
  resourceType: 'system',
  resourceId: 'test-001',
  metadata: {
    testType: 'connectivity',
    timestamp: new Date().toISOString()
  }
});

// Buscar estatísticas
const stats = await AuditService.getSystemStats();
console.log('Estatísticas do sistema:', stats);
```

### Teste 4: Sistema de Menções
```javascript
import { MentionService } from './src/services/mentionService.js';

// Testar detecção de menções
const text = 'Olá @jeferson, preciso que você verifique @admin este candidato.';
const mentions = MentionService.extractMentions(text);
console.log('Menções detectadas:', mentions);

// Deve retornar: ['jeferson', 'admin']

// Criar notificação de menção
await MentionService.createMentionNotification('1', '@jeferson', '2', 'Analista');
console.log('✅ Notificação de menção criada');
```

### Teste 5: Operações com Candidatos (Repositório VagasPopular)
```javascript
import { GitHubDataService } from './src/services/githubDataService.js';

// Buscar dados de candidatos
const candidates = await GitHubDataService.getCandidatesData();
console.log('Candidatos carregados:', candidates.length);

// Salvar teste no repositório de candidatos
await GitHubDataService.saveCandidateFile(
  'test-connection.json',
  { test: true, timestamp: new Date().toISOString() },
  'Teste de conectividade'
);

console.log('✅ Teste salvo no repositório VagasPopular');
```

## 📋 Checklist de Validação

### ✅ Conectividade
- [ ] Repositório DadosSistemaRH acessível
- [ ] Repositório VagasPopular acessível  
- [ ] Token DADOS2 funcionando
- [ ] Permissões adequadas configuradas

### ✅ Operações de Usuários
- [ ] Buscar usuários existentes
- [ ] Criar novo usuário
- [ ] Atualizar dados de usuário
- [ ] Deletar usuário (teste com cuidado)
- [ ] Logs de auditoria sendo gerados

### ✅ Sistema de Auditoria
- [ ] Registrar ações no log
- [ ] Buscar histórico de ações
- [ ] Gerar estatísticas do sistema
- [ ] Cache funcionando corretamente

### ✅ Sistema de Menções
- [ ] Detectar menções em texto
- [ ] Criar notificações
- [ ] Buscar menções por usuário
- [ ] Marcar como lida

### ✅ Separação de Dados
- [ ] Dados de usuários apenas no DadosSistemaRH
- [ ] Dados de candidatos apenas no VagasPopular
- [ ] Logs de auditoria no repositório correto
- [ ] Backup automático funcionando

## 🔍 Testes Manuais na Interface

### 1. Login no Sistema
1. Acesse o sistema
2. Use: `jeferson@sistemahr.com` / `873090As#`
3. Verifique se login foi registrado na auditoria

### 2. Gestão de Usuários
1. Vá para "Gestão de Usuários"
2. Crie um novo usuário
3. Edite dados do usuário
4. Verifique histórico de alterações
5. Adicione comentário sobre o usuário

### 3. Gestão de Candidatos
1. Vá para "Dashboard Principal"
2. Adicione novo candidato
3. Mude status do candidato
4. Adicione comentário com @menção
5. Verifique notificações

### 4. Sistema de Notificações
1. Faça uma menção a outro usuário
2. Verifique se notificação foi criada
3. Marque notificação como lida
4. Teste painel de notificações

## 🚨 Resolução de Problemas

### Erro 403 - Forbidden
```bash
Problema: Token sem permissões adequadas
Solução: Verificar permissões 'repo' no GitHub
```

### Erro 404 - Not Found
```bash
Problema: Repositório não encontrado
Solução: 
1. Verificar se DadosSistemaRH foi criado
2. Verificar owner/repo no código
3. Verificar se token tem acesso ao repositório
```

### Dados não aparecem
```bash
Problema: Cache desatualizado ou erro de sincronização
Solução:
1. Limpar cache do navegador
2. Verificar console para erros
3. Testar conectividade manualmente
```

### Performance lenta
```bash
Problema: Muitas requests simultâneas
Solução:
1. Verificar se cache está funcionando
2. Reduzir frequência de atualizações
3. Otimizar requests paralelos
```

## 📊 Monitoramento em Produção

### Métricas a Acompanhar
```javascript
// Estatísticas do sistema
const stats = await GitHubDataService.getRepositoryStats();

// Verificar:
// - Número de arquivos em cada repositório
// - Última atualização
// - Disponibilidade dos serviços
// - Performance das operações
```

### Alertas Importantes
- ❌ Repositório inacessível por > 5 minutos
- ⚠️ Cache com mais de 5 minutos desatualizado
- 🚨 Erro de permissão em operações de usuários
- 📈 Mais de 100 operações por minuto (verificar uso)

## 🔄 Script de Teste Automático

```bash
#!/bin/bash
# test-sistema-completo.sh

echo "🧪 Iniciando testes do Sistema RH Moderno..."

# Testar conectividade
echo "1. Testando conectividade..."
npm run test:connectivity

# Testar operações de usuários  
echo "2. Testando operações de usuários..."
npm run test:users

# Testar sistema de auditoria
echo "3. Testando auditoria..."
npm run test:audit

# Testar menções
echo "4. Testando sistema de menções..."
npm run test:mentions

# Testar separação de dados
echo "5. Testando separação de repositórios..."
npm run test:data-separation

echo "✅ Todos os testes concluídos!"
```

## 📞 Suporte Durante Testes

### Contato Direto
- **Desenvolvedor**: Jeferson  
- **WhatsApp**: (82) 99915-8412
- **Email**: jeferson@sistemahr.com

### Logs Úteis
```javascript
// Ativar logs detalhados
localStorage.setItem('debug-mode', 'true');

// Verificar logs no console
// Buscar por: ✅ Sucesso, ⚠️ Avisos, ❌ Erros
```

---

## 🎯 Resultado Esperado

Após todos os testes, você deve ter:

✅ **Sistema funcionando com repositórios separados**  
✅ **Dados de usuários seguros no DadosSistemaRH**  
✅ **Auditoria completa de todas as ações**  
✅ **Sistema de menções operacional**  
✅ **Performance otimizada com cache**  
✅ **Interface responsiva e interativa**  

**🚀 Sistema pronto para uso em produção!**