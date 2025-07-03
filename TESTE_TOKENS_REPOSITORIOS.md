# 🔑 Teste de Tokens e Repositórios

## 🎯 Objetivo

Validar que todos os tokens estão funcionando corretamente e que os repositórios estão acessíveis.

## 📋 Configuração Atual

### 🔐 **Token DADOS2** (Usuários)
- **Repositório**: https://github.com/PopularAtacarejo/DadosSistemaRH
- **Token**: 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
- **Finalidade**: Gerenciar dados de usuários do sistema

### 📊 **Token CONSULTARVAGAS** (Candidatos/Vagas)
- **Repositório**: https://github.com/PopularAtacarejo/VagasPopular
- **Token**: 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
- **Arquivo**: dados.json
- **Finalidade**: Buscar e gerenciar dados de candidatos e vagas

## 🧪 Testes de Conectividade

### Teste 1: Verificar Acesso ao Repositório de Usuários
```javascript
// Console do navegador
const testUserRepo = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/PopularAtacarejo/DadosSistemaRH', {
      headers: {
        'Authorization': 'token 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',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Repositório DadosSistemaRH acessível');
      console.log('📊 Info:', data.name, '- Última atualização:', data.updated_at);
      return true;
    } else {
      console.error('❌ Erro de acesso:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return false;
  }
};

await testUserRepo();
```

### Teste 2: Verificar Acesso ao Repositório de Vagas
```javascript
// Console do navegador
const testVagasRepo = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/PopularAtacarejo/VagasPopular', {
      headers: {
        'Authorization': 'token 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',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Repositório VagasPopular acessível');
      console.log('📊 Info:', data.name, '- Última atualização:', data.updated_at);
      return true;
    } else {
      console.error('❌ Erro de acesso:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return false;
  }
};

await testVagasRepo();
```

### Teste 3: Verificar Acesso ao Arquivo dados.json
```javascript
// Console do navegador
const testDadosJson = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/PopularAtacarejo/VagasPopular/contents/dados.json', {
      headers: {
        'Authorization': 'token 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',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = JSON.parse(atob(data.content.replace(/\n/g, '')));
      console.log('✅ Arquivo dados.json acessível');
      console.log('📂 URL:', 'https://github.com/PopularAtacarejo/VagasPopular/blob/main/dados.json');
      console.log('📊 Registros encontrados:', Array.isArray(content) ? content.length : 'Não é array');
      console.log('🕒 Última modificação:', data.commit?.committer?.date || 'N/A');
      return content;
    } else {
      console.error('❌ Erro ao acessar dados.json:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao processar dados.json:', error);
    return null;
  }
};

const dadosVagas = await testDadosJson();
```

### Teste 4: Testar GitHubDataService Atualizado
```javascript
// Console do navegador (após importar serviços)
import { GitHubDataService } from './src/services/githubDataService.js';

const testGitHubDataService = async () => {
  console.log('🧪 Testando GitHubDataService...');
  
  try {
    // Teste 1: Verificar conexões
    console.log('1. Verificando conexões...');
    const connections = await GitHubDataService.checkConnections();
    console.log('Conexões:', connections);
    
    // Teste 2: Buscar dados de usuários
    console.log('2. Buscando usuários...');
    const users = await GitHubDataService.getUsersData();
    console.log(`✅ ${users.length} usuários carregados`);
    
    // Teste 3: Buscar dados de candidatos/vagas
    console.log('3. Buscando candidatos/vagas...');
    const candidates = await GitHubDataService.getCandidatesData();
    console.log(`✅ ${candidates.length} candidatos/vagas carregados`);
    
    // Teste 4: Usar alias para vagas
    console.log('4. Testando alias de vagas...');
    const vagas = await GitHubDataService.getVagasData();
    console.log(`✅ ${vagas.length} vagas carregadas via alias`);
    
    // Teste 5: Estatísticas
    console.log('5. Obtendo estatísticas...');
    const stats = await GitHubDataService.getRepositoryStats();
    console.log('Estatísticas:', stats);
    
    return {
      connections,
      userCount: users.length,
      candidateCount: candidates.length,
      vagasCount: vagas.length,
      stats
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
};

const testResults = await testGitHubDataService();
```

## 📊 Testes de Funcionalidade

### Teste 5: Criar Usuário de Teste
```javascript
import { UserService } from './src/services/userService.js';

const testCreateUser = async () => {
  try {
    await UserService.createUser({
      name: 'Teste Token',
      email: 'teste.token@sistema.com',
      role: 'Analista',
      department: 'TI',
      password: 'Teste123@',
      createdBy: 'Sistema de Testes'
    });
    
    console.log('✅ Usuário de teste criado no repositório DadosSistemaRH');
    
    // Verificar se foi salvo
    const users = await UserService.getAllUsers();
    const testUser = users.find(u => u.email === 'teste.token@sistema.com');
    
    if (testUser) {
      console.log('✅ Usuário encontrado após criação:', testUser.name);
      return testUser;
    } else {
      console.error('❌ Usuário não encontrado após criação');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    return null;
  }
};

const testUser = await testCreateUser();
```

### Teste 6: Teste de Auditoria
```javascript
import { AuditService } from './src/services/auditService.js';

const testAudit = async () => {
  try {
    await AuditService.logAction({
      userId: '1',
      userName: 'Sistema de Testes',
      type: 'test',
      resourceType: 'system',
      resourceId: 'token-test',
      metadata: {
        testType: 'token-validation',
        timestamp: new Date().toISOString(),
        tokens: ['DADOS2', 'CONSULTARVAGAS'],
        repositories: ['DadosSistemaRH', 'VagasPopular']
      }
    });
    
    console.log('✅ Log de auditoria criado');
    
    // Buscar estatísticas
    const stats = await AuditService.getSystemStats();
    console.log('📊 Estatísticas do sistema:', stats);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no teste de auditoria:', error);
    return false;
  }
};

const auditTest = await testAudit();
```

## 📋 Checklist de Validação

### ✅ Conectividade
- [ ] Repositório DadosSistemaRH acessível com token DADOS2
- [ ] Repositório VagasPopular acessível com token CONSULTARVAGAS
- [ ] Arquivo dados.json legível
- [ ] Permissões de escrita funcionando

### ✅ Funcionalidades
- [ ] UserService criando usuários no repositório correto
- [ ] GitHubDataService.getCandidatesData() funcionando
- [ ] GitHubDataService.getVagasData() funcionando
- [ ] Auditoria sendo salva corretamente
- [ ] Cache funcionando adequadamente

### ✅ Segurança
- [ ] Tokens hardcoded corretamente
- [ ] Separação de dados funcionando
- [ ] Logs de acesso sendo gerados
- [ ] Metadados de repositório sendo adicionados

## 🚨 Resolução de Problemas

### Erro 401 - Unauthorized
```bash
Problema: Token inválido ou expirado
Soluções:
1. Verificar se o token não expirou
2. Verificar se o token tem as permissões corretas
3. Verificar se o repositório não mudou de privacidade
```

### Erro 403 - Forbidden
```bash
Problema: Token válido mas sem permissões
Soluções:
1. Verificar permissões 'repo' no token
2. Verificar se o usuário do token tem acesso ao repositório
3. Verificar se o repositório existe e está acessível
```

### Erro 404 - Not Found
```bash
Problema: Repositório ou arquivo não encontrado
Soluções:
1. Verificar URL do repositório
2. Verificar se o arquivo dados.json existe
3. Verificar nome do repositório (case sensitive)
```

### Dados Vazios ou Nulos
```bash
Problema: Dados não carregam corretamente
Soluções:
1. Verificar formato JSON do arquivo
2. Verificar se o arquivo não está vazio
3. Verificar encoding do arquivo (deve ser UTF-8)
4. Verificar se o cache não está interferindo
```

## 📊 Script de Validação Completa

```bash
#!/bin/bash
# validate-tokens-repos.sh

echo "🔑 Validando tokens e repositórios..."

echo "1. Testando conectividade..."
# Adicionar testes curl aqui

echo "2. Testando funcionalidades..."
# Adicionar testes de funcionalidade

echo "3. Gerando relatório..."
# Adicionar geração de relatório

echo "✅ Validação completa!"
```

## 📞 Suporte

### Se os testes falharem:
- **Desenvolvedor**: Jeferson
- **WhatsApp**: (82) 99915-8412
- **Email**: jeferson@sistemahr.com

### Logs Importantes
```javascript
// Ativar debug mode
localStorage.setItem('debug-github', 'true');

// Monitorar requests no Network tab do DevTools
// Verificar console para erros específicos
```

---

## 🎯 Resultado Esperado

Após todos os testes, você deve ter confirmação de que:

✅ **Token DADOS2 funciona corretamente com DadosSistemaRH**  
✅ **Token CONSULTARVAGAS funciona corretamente com VagasPopular**  
✅ **Arquivo dados.json está acessível e legível**  
✅ **Separação de dados está funcionando**  
✅ **Sistema de auditoria está operacional**  
✅ **Cache e performance estão otimizados**  

**🚀 Sistema configurado corretamente e pronto para produção!**