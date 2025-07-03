// 🚀 SCRIPT DE CONFIGURAÇÃO ONLINE - SISTEMA RH
// Execute no console do navegador (F12 -> Console)

console.log('🔧 CONFIGURANDO SISTEMA RH ONLINE...');
console.log('📂 Repositório: https://github.com/PopularAtacarejo/SistemaRH');
console.log('🔑 Token: Dados2 (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)');

// Verificar conectividade com GitHub
async function verificarConectividade() {
  console.log('\n📡 1. Verificando conectividade com GitHub...');
  
  try {
    const response = await fetch('https://api.github.com/repos/PopularAtacarejo/SistemaRH', {
      headers: {
        'Authorization': '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',
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
      console.log(`❌ Erro de acesso: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

// Criar usuário master no repositório
async function criarUsuarioMaster() {
  console.log('\n👑 2. Criando usuário master no GitHub...');
  
  const masterUser = {
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
    description: 'Usuário master - Desenvolvedor principal (Sistema Online)',
    repository: 'SistemaRH'
  };

  try {
    // Verificar se arquivo já existe
    let sha = null;
    try {
      const checkResponse = await fetch('https://api.github.com/repos/PopularAtacarejo/SistemaRH/contents/usuarios.json', {
        headers: {
          'Authorization': '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',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (checkResponse.ok) {
        const fileData = await checkResponse.json();
        sha = fileData.sha;
        console.log('📄 Arquivo usuarios.json já existe, atualizando...');
      } else {
        console.log('📝 Criando novo arquivo usuarios.json...');
      }
    } catch (error) {
      console.log('📝 Criando novo arquivo usuarios.json...');
    }

    const body = {
      message: `Criação do usuário master Jeferson - ${new Date().toISOString()}`,
      content: btoa(JSON.stringify([masterUser], null, 2)),
      branch: 'main'
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch('https://api.github.com/repos/PopularAtacarejo/SistemaRH/contents/usuarios.json', {
      method: 'PUT',
      headers: {
        'Authorization': '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',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      console.log('🎉 USUÁRIO MASTER CRIADO NO GITHUB!');
      console.log('📂 Arquivo: https://github.com/PopularAtacarejo/SistemaRH/blob/main/usuarios.json');
      return masterUser;
    } else {
      const error = await response.json();
      console.log('❌ Erro ao criar usuário:', response.status, error.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na criação:', error.message);
    return null;
  }
}

// Configurar login local
async function configurarLoginLocal(masterUser) {
  console.log('\n🔐 3. Configurando login local...');
  
  // Limpar dados antigos
  localStorage.removeItem('hrSystem_currentUser');
  sessionStorage.removeItem('userLoggedIn');
  
  // Configurar usuário master
  const userForSession = {
    id: masterUser.id,
    email: masterUser.email,
    name: masterUser.name,
    role: masterUser.role,
    department: masterUser.department,
    isActive: masterUser.isActive,
    isMaster: masterUser.isMaster,
    permissions: masterUser.permissions,
    createdAt: masterUser.createdAt,
    lastUpdate: masterUser.lastUpdate
  };

  localStorage.setItem('hrSystem_currentUser', JSON.stringify(userForSession));
  sessionStorage.setItem('userLoggedIn', 'true');
  window.currentUser = userForSession;

  console.log('✅ Login local configurado!');
  console.log('👤 Usuário:', userForSession.name);
  console.log('🔧 Função:', userForSession.role);
  console.log('👑 Master:', userForSession.isMaster);
  
  return userForSession;
}

// Criar arquivo inicial de candidatos
async function criarArquivoCandidatos() {
  console.log('\n📊 4. Criando arquivo inicial de candidatos...');
  
  try {
    const candidatosIniciais = [];

    const body = {
      message: `Criação do arquivo candidatos.json - ${new Date().toISOString()}`,
      content: btoa(JSON.stringify(candidatosIniciais, null, 2)),
      branch: 'main'
    };

    const response = await fetch('https://api.github.com/repos/PopularAtacarejo/SistemaRH/contents/candidatos.json', {
      method: 'PUT',
      headers: {
        'Authorization': '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',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      console.log('✅ Arquivo candidatos.json criado!');
      console.log('📂 Arquivo: https://github.com/PopularAtacarejo/SistemaRH/blob/main/candidatos.json');
      return true;
    } else {
      const error = await response.json();
      console.log('⚠️ Arquivo candidatos.json já existe ou erro:', error.message);
      return true; // Não é erro crítico
    }
  } catch (error) {
    console.log('⚠️ Erro ao criar arquivo candidatos.json:', error.message);
    return true; // Não é erro crítico
  }
}

// Função principal
async function configurarSistemaCompleto() {
  console.log('\n🚀 === CONFIGURAÇÃO COMPLETA DO SISTEMA ONLINE ===\n');
  
  // 1. Verificar conectividade
  const conectividadeOk = await verificarConectividade();
  if (!conectividadeOk) {
    console.log('\n❌ Falha na conectividade. Sistema não pode ser configurado online.');
    return false;
  }
  
  // 2. Criar usuário master
  const masterUser = await criarUsuarioMaster();
  if (!masterUser) {
    console.log('\n❌ Falha na criação do usuário master.');
    return false;
  }
  
  // 3. Configurar login local
  await configurarLoginLocal(masterUser);
  
  // 4. Criar arquivo de candidatos
  await criarArquivoCandidatos();
  
  // 5. Resultado final
  console.log('\n🎯 === SISTEMA CONFIGURADO COM SUCESSO ===');
  console.log('✅ FUNCIONAMENTO ONLINE ATIVADO!');
  console.log('\n📋 CREDENCIAIS DE ACESSO:');
  console.log('📧 Email: jeferson@sistemahr.com');
  console.log('🔑 Senha: 873090As#27');
  console.log('👑 Nível: Master (todos os poderes)');
  console.log('\n📂 REPOSITÓRIO GITHUB:');
  console.log('🔗 https://github.com/PopularAtacarejo/SistemaRH');
  console.log('📄 Usuários: usuarios.json');
  console.log('📊 Candidatos: candidatos.json');
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. ✅ Sistema configurado e funcionando online');
  console.log('2. 🔄 Recarregue a página para ativar as alterações');
  console.log('3. 🔐 Faça login com as credenciais acima');
  console.log('4. 👥 Crie outros usuários da equipe');
  console.log('5. 💼 Comece a gerenciar candidatos e vagas');
  
  // Recarregar página após 3 segundos
  console.log('\n🔄 Recarregando página em 3 segundos...');
  setTimeout(() => {
    location.reload();
  }, 3000);
  
  return true;
}

// Disponibilizar funções globalmente
window.verificarConectividade = verificarConectividade;
window.criarUsuarioMaster = criarUsuarioMaster;
window.configurarLoginLocal = configurarLoginLocal;
window.configurarSistemaCompleto = configurarSistemaCompleto;

// Instruções
console.log(`
🎯 EXECUTE:

configurarSistemaCompleto()

📧 CREDENCIAIS:
Email: jeferson@sistemahr.com
Senha: 873090As#27
`);

// Auto-executar
console.log('🚀 Iniciando configuração automática em 2 segundos...');
setTimeout(() => {
  configurarSistemaCompleto();
}, 2000);
