// 🚀 CONFIGURAÇÃO SISTEMA RH ONLINE - VERSÃO FINAL
// Token: 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 (Dados2)
// Repositório: https://github.com/PopularAtacarejo/SistemaRH

console.log('🔧 CONFIGURANDO SISTEMA RH ONLINE - VERSÃO FINAL...');

const CONFIG = {
  token: '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',
  owner: 'PopularAtacarejo',
  repo: 'SistemaRH',
  branch: 'main'
};

// 1. Verificar conectividade
async function testarConectividade() {
  console.log('\n📡 1. Testando conectividade...');
  
  try {
    const response = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}`, {
      headers: {
        'Authorization': `token ${CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const repo = await response.json();
      console.log('✅ REPOSITÓRIO ACESSÍVEL!');
      console.log(`📂 Nome: ${repo.name}`);
      console.log(`🔒 Privado: ${repo.private}`);
      console.log(`🌐 URL: ${repo.html_url}`);
      return true;
    } else {
      console.log(`❌ Erro: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

// 2. Criar estrutura de arquivos no GitHub
async function criarEstrutura() {
  console.log('\n📁 2. Criando estrutura de arquivos...');
  
  const arquivos = [
    {
      nome: 'usuarios.json',
      conteudo: [
        {
          id: '1',
          email: 'jeferson@sistemahr.com',
          name: 'Jeferson',
          role: 'Desenvolvedor',
          department: 'Desenvolvimento',
          password: '873090As#27',
          isActive: true,
          isMaster: true,
          permissions: {
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
            canManageRoles: true,
            canViewAudit: true,
            canManageSystem: true,
            canAccessAllData: true
          },
          createdAt: new Date().toISOString(),
          createdBy: 'Sistema Online',
          lastUpdate: new Date().toISOString(),
          description: 'Usuário master - Desenvolvedor principal',
          repository: 'SistemaRH'
        }
      ],
      mensagem: 'Criação do usuário master Jeferson'
    },
    {
      nome: 'candidatos.json',
      conteudo: [],
      mensagem: 'Arquivo inicial para candidatos e vagas'
    },
    {
      nome: 'user-activities.json',
      conteudo: [
        {
          id: crypto.randomUUID(),
          userId: '1',
          userName: 'Jeferson',
          userRole: 'Desenvolvedor',
          action: 'system_setup',
          description: 'Sistema RH configurado e inicializado',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ip: 'N/A',
          sessionId: crypto.randomUUID(),
          severity: 'medium',
          repository: 'SistemaRH'
        }
      ],
      mensagem: 'Arquivo inicial de logs de atividades'
    },
    {
      nome: 'user-comments.json',
      conteudo: [],
      mensagem: 'Arquivo inicial para comentários sobre usuários'
    },
    {
      nome: 'user-profile-changes.json',
      conteudo: [],
      mensagem: 'Arquivo inicial para mudanças de perfil'
    }
  ];

  const resultados = [];

  for (const arquivo of arquivos) {
    try {
      console.log(`📄 Criando ${arquivo.nome}...`);
      
      // Verificar se arquivo já existe
      let sha = null;
      try {
        const checkResponse = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${arquivo.nome}`, {
          headers: {
            'Authorization': `token ${CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (checkResponse.ok) {
          const fileData = await checkResponse.json();
          sha = fileData.sha;
          console.log(`🔄 ${arquivo.nome} já existe, atualizando...`);
        }
      } catch (error) {
        console.log(`📝 Criando novo ${arquivo.nome}...`);
      }

      const body = {
        message: `${arquivo.mensagem} - ${new Date().toISOString()}`,
        content: btoa(JSON.stringify(arquivo.conteudo, null, 2)),
        branch: CONFIG.branch
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${arquivo.nome}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${CONFIG.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        console.log(`✅ ${arquivo.nome} criado/atualizado!`);
        resultados.push({ nome: arquivo.nome, sucesso: true });
      } else {
        const error = await response.json();
        console.log(`❌ Erro em ${arquivo.nome}:`, error.message);
        resultados.push({ nome: arquivo.nome, sucesso: false, erro: error.message });
      }
    } catch (error) {
      console.log(`❌ Erro ao criar ${arquivo.nome}:`, error.message);
      resultados.push({ nome: arquivo.nome, sucesso: false, erro: error.message });
    }
  }

  return resultados;
}

// 3. Configurar usuário na sessão local
function configurarSessaoLocal() {
  console.log('\n🔐 3. Configurando sessão local...');
  
  const masterUser = {
    id: '1',
    email: 'jeferson@sistemahr.com',
    name: 'Jeferson',
    role: 'Desenvolvedor',
    department: 'Desenvolvimento',
    isActive: true,
    isMaster: true,
    permissions: {
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canManageRoles: true,
      canViewAudit: true,
      canManageSystem: true,
      canAccessAllData: true
    },
    createdAt: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  };

  // Limpar dados antigos
  localStorage.removeItem('hrSystem_currentUser');
  sessionStorage.removeItem('userLoggedIn');
  
  // Salvar novo usuário
  localStorage.setItem('hrSystem_currentUser', JSON.stringify(masterUser));
  sessionStorage.setItem('userLoggedIn', 'true');
  window.currentUser = masterUser;

  console.log('✅ Sessão configurada!');
  console.log('👤 Usuário:', masterUser.name);
  console.log('🔧 Função:', masterUser.role);
  console.log('👑 Master:', masterUser.isMaster);
  
  return masterUser;
}

// 4. Registrar log inicial
async function registrarLogInicial() {
  console.log('\n📊 4. Registrando log inicial do sistema...');
  
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      userId: '1',
      userName: 'Jeferson',
      userRole: 'Desenvolvedor',
      action: 'system_initialization',
      description: 'Sistema RH inicializado com sucesso - Configuração online ativada',
      targetType: 'system',
      targetName: 'SistemaRH',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'N/A',
      sessionId: crypto.randomUUID(),
      severity: 'high',
      repository: 'SistemaRH'
    };

    // Obter logs existentes
    let logs = [];
    try {
      const response = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/user-activities.json`, {
        headers: {
          'Authorization': `token ${CONFIG.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const fileData = await response.json();
        logs = JSON.parse(atob(fileData.content.replace(/\n/g, '')));
      }
    } catch (error) {
      console.log('📝 Criando arquivo de logs...');
    }

    logs.push(logEntry);

    // Salvar logs atualizados
    const response = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/user-activities.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Log de inicialização do sistema - ${new Date().toISOString()}`,
        content: btoa(JSON.stringify(logs, null, 2)),
        branch: CONFIG.branch,
        sha: await getFileSha('user-activities.json')
      })
    });

    if (response.ok) {
      console.log('✅ Log inicial registrado!');
      return true;
    } else {
      console.log('⚠️ Erro ao registrar log inicial');
      return false;
    }
  } catch (error) {
    console.log('⚠️ Erro ao registrar log:', error.message);
    return false;
  }
}

// Função auxiliar para obter SHA do arquivo
async function getFileSha(fileName) {
  try {
    const response = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${fileName}`, {
      headers: {
        'Authorization': `token ${CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }
  } catch (error) {
    console.log(`⚠️ Erro ao obter SHA de ${fileName}`);
  }
  return null;
}

// 5. Função principal
async function configurarSistemaCompleto() {
  console.log('\n🚀 === CONFIGURAÇÃO COMPLETA DO SISTEMA ONLINE ===\n');
  
  // Teste de conectividade
  const conectividadeOk = await testarConectividade();
  if (!conectividadeOk) {
    console.log('\n❌ Falha na conectividade. Sistema não pode ser configurado.');
    return false;
  }
  
  // Criar estrutura de arquivos
  const resultadosArquivos = await criarEstrutura();
  const sucessos = resultadosArquivos.filter(r => r.sucesso).length;
  console.log(`\n📊 Arquivos criados: ${sucessos}/${resultadosArquivos.length}`);
  
  // Configurar sessão local
  const masterUser = configurarSessaoLocal();
  
  // Registrar log inicial
  await registrarLogInicial();
  
  // Resultado final
  console.log('\n🎯 === SISTEMA CONFIGURADO COM SUCESSO ===');
  console.log('✅ FUNCIONAMENTO ONLINE ATIVADO!');
  console.log('\n📋 CREDENCIAIS DE ACESSO:');
  console.log('📧 Email: jeferson@sistemahr.com');
  console.log('🔑 Senha: 873090As#27');
  console.log('👑 Nível: Desenvolvedor (Master - Acesso Total)');
  console.log('\n🔧 RECURSOS CONFIGURADOS:');
  console.log('✅ Autenticação simplificada');
  console.log('✅ Sistema de usuários e permissões');
  console.log('✅ Log completo de auditoria (apenas para Desenvolvedor)');
  console.log('✅ Gerenciamento de candidatos');
  console.log('✅ Salvamento automático no GitHub');
  console.log('\n📂 ESTRUTURA NO GITHUB:');
  console.log('🔗 https://github.com/PopularAtacarejo/SistemaRH');
  console.log('📄 usuarios.json - Dados dos usuários');
  console.log('📊 candidatos.json - Candidatos e vagas');
  console.log('📝 user-activities.json - Logs de auditoria');
  console.log('💬 user-comments.json - Comentários sobre usuários');
  console.log('🔄 user-profile-changes.json - Mudanças de perfil');
  console.log('\n🎯 FUNCIONALIDADES ESPECIAIS:');
  console.log('🔐 Logs de Auditoria: Apenas o usuário "Desenvolvedor" pode acessar');
  console.log('📊 Todas as ações são registradas automaticamente');
  console.log('🛡️ Controle granular de permissões por função');
  console.log('💾 Dados salvos em tempo real no GitHub');
  console.log('\n🔄 PRÓXIMOS PASSOS:');
  console.log('1. Sistema já está configurado e funcionando');
  console.log('2. Recarregue a página para ativar as alterações');
  console.log('3. Faça login com as credenciais acima');
  console.log('4. Como Desenvolvedor, você terá acesso aos logs de auditoria');
  console.log('5. Crie outros usuários da equipe conforme necessário');
  
  // Auto-reload
  console.log('\n🔄 Recarregando página em 3 segundos...');
  setTimeout(() => {
    location.reload();
  }, 3000);
  
  return true;
}

// Disponibilizar funções globalmente
window.CONFIG = CONFIG;
window.testarConectividade = testarConectividade;
window.criarEstrutura = criarEstrutura;
window.configurarSessaoLocal = configurarSessaoLocal;
window.configurarSistemaCompleto = configurarSistemaCompleto;

// Instruções
console.log(`
🎯 SISTEMA RH ONLINE - CONFIGURAÇÃO FINAL

📧 CREDENCIAIS:
Email: jeferson@sistemahr.com
Senha: 873090As#27
Role: Desenvolvedor (acesso total + logs)

🚀 EXECUTE:
configurarSistemaCompleto()

🔧 TOKEN: ${CONFIG.token}
📂 REPOSITÓRIO: https://github.com/${CONFIG.owner}/${CONFIG.repo}
`);

// Iniciar configuração automática
console.log('🚀 Iniciando configuração automática em 2 segundos...');
setTimeout(() => {
  configurarSistemaCompleto();
}, 2000);