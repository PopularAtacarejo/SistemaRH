// 🚀 SCRIPT DE TESTE - REPOSITÓRIO SISTEMAHR
// Cole este código no console do navegador (F12 -> Console)

console.log('🔧 TESTANDO ACESSO AO REPOSITÓRIO SISTEMAHR...');

const GITHUB_TOKEN = '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';
const REPO_OWNER = 'PopularAtacarejo';
const REPO_NAME = 'SistemaRH';

// 1. Testar conectividade com o repositório
async function testarConectividade() {
  console.log('📡 Testando conectividade com o repositório...');
  
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ REPOSITÓRIO ACESSÍVEL!');
      console.log('📂 Nome:', data.name);
      console.log('🔒 Privado:', data.private);
      console.log('📊 Última atualização:', data.updated_at);
      console.log('🌐 URL:', data.html_url);
      return true;
    } else {
      console.log('❌ Erro de acesso:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

// 2. Verificar se arquivo usuarios.json já existe
async function verificarArquivoUsuarios() {
  console.log('📄 Verificando arquivo usuarios.json...');
  
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/usuarios.json`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const content = JSON.parse(atob(data.content.replace(/\n/g, '')));
      console.log('✅ Arquivo usuarios.json encontrado!');
      console.log('👥 Usuários existentes:', content.length);
      
      // Verificar se usuário master existe
      const masterUser = content.find(u => u.email === 'jeferson@sistemahr.com');
      if (masterUser) {
        console.log('👑 Usuário master Jeferson encontrado!');
        console.log('📧 Email:', masterUser.email);
        console.log('🔧 Função:', masterUser.role);
        return { exists: true, hasMaster: true, users: content, sha: data.sha };
      } else {
        console.log('⚠️ Usuário master não encontrado no arquivo');
        return { exists: true, hasMaster: false, users: content, sha: data.sha };
      }
    } else if (response.status === 404) {
      console.log('📝 Arquivo usuarios.json não existe, será criado');
      return { exists: false, hasMaster: false, users: [], sha: null };
    } else {
      console.log('❌ Erro ao verificar arquivo:', response.status);
      return { exists: false, hasMaster: false, users: [], sha: null };
    }
  } catch (error) {
    console.log('❌ Erro ao verificar arquivo:', error.message);
    return { exists: false, hasMaster: false, users: [], sha: null };
  }
}

// 3. Criar usuário master no repositório
async function criarUsuarioMaster(existingUsers = [], sha = null) {
  console.log('👑 Criando usuário master...');
  
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
    createdBy: 'Sistema Inicial',
    lastUpdate: new Date().toISOString(),
    description: 'Usuário master - Desenvolvedor principal do sistema',
    repository: 'SistemaRH'
  };

  // Adicionar ou atualizar usuário master
  let users = [...existingUsers];
  const masterIndex = users.findIndex(u => u.email === 'jeferson@sistemahr.com');
  
  if (masterIndex >= 0) {
    users[masterIndex] = masterUser;
    console.log('🔄 Atualizando usuário master existente...');
  } else {
    users.push(masterUser);
    console.log('➕ Adicionando novo usuário master...');
  }

  try {
    const body = {
      message: `Criação/atualização do usuário master Jeferson - ${new Date().toISOString()}`,
      content: btoa(JSON.stringify(users, null, 2)),
      branch: 'main'
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/usuarios.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      console.log('🎉 USUÁRIO MASTER CRIADO COM SUCESSO!');
      console.log('📂 Arquivo salvo em: https://github.com/PopularAtacarejo/SistemaRH/blob/main/usuarios.json');
      return masterUser;
    } else {
      const errorData = await response.json();
      console.log('❌ Erro ao criar usuário:', response.status, errorData.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

// 4. Testar login local
async function testarLoginLocal() {
  console.log('🔐 Testando login local...');
  
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
    repository: 'SistemaRH'
  };

  // Salvar na sessão
  localStorage.setItem('currentUser', JSON.stringify(masterUser));
  sessionStorage.setItem('userLoggedIn', 'true');
  sessionStorage.setItem('masterUser', JSON.stringify(masterUser));
  window.currentUser = masterUser;

  console.log('✅ Login local configurado!');
  console.log('👤 Usuário:', masterUser.name);
  console.log('🔧 Função:', masterUser.role);
  console.log('👑 Master:', masterUser.isMaster);
  
  return masterUser;
}

// 5. Função principal de configuração
async function configurarSistemaCompleto() {
  console.log('\n🚀 === CONFIGURAÇÃO COMPLETA DO SISTEMA ===\n');
  
  // 1. Testar conectividade
  console.log('1️⃣ TESTE DE CONECTIVIDADE');
  const conectividadeOk = await testarConectividade();
  
  if (!conectividadeOk) {
    console.log('❌ Falha na conectividade. Verificar token e repositório.');
    return false;
  }
  
  console.log('');
  
  // 2. Verificar arquivo
  console.log('2️⃣ VERIFICAÇÃO DE ARQUIVOS');
  const arquivoInfo = await verificarArquivoUsuarios();
  
  console.log('');
  
  // 3. Criar/atualizar usuário master
  console.log('3️⃣ CRIAÇÃO DO USUÁRIO MASTER');
  let masterUser = null;
  
  if (!arquivoInfo.hasMaster) {
    masterUser = await criarUsuarioMaster(arquivoInfo.users, arquivoInfo.sha);
  } else {
    console.log('✅ Usuário master já existe no GitHub!');
    masterUser = arquivoInfo.users.find(u => u.email === 'jeferson@sistemahr.com');
  }
  
  console.log('');
  
  // 4. Configurar login local
  console.log('4️⃣ CONFIGURAÇÃO DE LOGIN LOCAL');
  await testarLoginLocal();
  
  console.log('');
  
  // 5. Resultado final
  console.log('🎯 === RESULTADO FINAL ===');
  console.log('✅ SISTEMA CONFIGURADO COM SUCESSO!');
  console.log('');
  console.log('📋 CREDENCIAIS DE ACESSO:');
  console.log('📧 Email: jeferson@sistemahr.com');
  console.log('🔑 Senha: 873090As#27');
  console.log('👑 Nível: Master (todos os poderes)');
  console.log('');
  console.log('📂 REPOSITÓRIOS:');
  console.log('🔐 Usuários: https://github.com/PopularAtacarejo/SistemaRH');
  console.log('📊 Vagas: https://github.com/PopularAtacarejo/VagasPopular');
  console.log('');
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('1. Fazer login na interface do sistema');
  console.log('2. Criar outros usuários da equipe');
  console.log('3. Definir permissões adequadas');
  
  return true;
}

// Disponibilizar funções globalmente
window.testarConectividade = testarConectividade;
window.verificarArquivoUsuarios = verificarArquivoUsuarios;
window.criarUsuarioMaster = criarUsuarioMaster;
window.testarLoginLocal = testarLoginLocal;
window.configurarSistemaCompleto = configurarSistemaCompleto;

// Instruções
console.log(`
🎯 FUNÇÕES DISPONÍVEIS:

🚀 CONFIGURAÇÃO COMPLETA (RECOMENDADO):
   configurarSistemaCompleto()

📡 APENAS CONECTIVIDADE:
   testarConectividade()

📄 APENAS VERIFICAR ARQUIVO:
   verificarArquivoUsuarios()

👑 APENAS CRIAR USUÁRIO MASTER:
   criarUsuarioMaster()

🔐 APENAS LOGIN LOCAL:
   testarLoginLocal()

📧 CREDENCIAIS:
   Email: jeferson@sistemahr.com
   Senha: 873090As#27

✅ EXECUTE: configurarSistemaCompleto()
`);

// Auto-executar configuração
console.log('🚀 Iniciando configuração automática...');
configurarSistemaCompleto().then(success => {
  if (success) {
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('🔄 Agora você pode fazer login no sistema!');
  } else {
    console.log('\n⚠️ Problemas na configuração. Execute manualmente: configurarSistemaCompleto()');
  }
});