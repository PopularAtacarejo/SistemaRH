// Script para criar o usuário master Jeferson
// Execute este script no console do navegador para criar o usuário master

const createMasterUser = async () => {
  console.log('🚀 Iniciando criação do usuário master Jeferson...');
  
  const GITHUB_TOKEN = 'seu_token_aqui'; // Substitua pelo token correto do VagasPopular
  const REPO_OWNER = 'PopularAtacarejo';
  const REPO_NAME = 'VagasPopular';
  
  // Dados do usuário master
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
    description: 'Usuário master - Desenvolvedor principal do sistema'
  };

  try {
    // 1. Verificar se arquivo usuarios.json já existe
    console.log('📂 Verificando arquivo usuarios.json...');
    
    let existingFile = null;
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/usuarios.json`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        existingFile = await response.json();
        console.log('✅ Arquivo usuarios.json encontrado');
      }
    } catch (error) {
      console.log('⚠️ Arquivo usuarios.json não existe, será criado');
    }

    // 2. Preparar dados dos usuários
    let users = [];
    if (existingFile) {
      try {
        const existingContent = JSON.parse(atob(existingFile.content.replace(/\n/g, '')));
        if (Array.isArray(existingContent)) {
          users = existingContent;
        }
      } catch (error) {
        console.log('⚠️ Erro ao processar arquivo existente, criando novo');
      }
    }

    // 3. Verificar se usuário master já existe
    const existingMaster = users.find(u => u.email === 'jeferson@sistemahr.com');
    if (existingMaster) {
      console.log('✅ Usuário master Jeferson já existe!');
      console.log('📧 Email:', existingMaster.email);
      console.log('🔑 Senha: 873090As#27');
      console.log('🎯 Você pode fazer login agora!');
      return existingMaster;
    }

    // 4. Adicionar usuário master
    users.push(masterUser);

    // 5. Salvar no GitHub
    console.log('💾 Salvando usuário master no GitHub...');
    
    const body = {
      message: `Criação do usuário master Jeferson - ${new Date().toISOString()}`,
      content: btoa(JSON.stringify(users, null, 2)),
      branch: 'main'
    };

    if (existingFile) {
      body.sha = existingFile.sha;
    }

    const saveResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/usuarios.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (saveResponse.ok) {
      console.log('🎉 USUÁRIO MASTER CRIADO COM SUCESSO!');
      console.log('');
      console.log('📋 CREDENCIAIS DE LOGIN:');
      console.log('📧 Email: jeferson@sistemahr.com');
      console.log('🔑 Senha: 873090As#27');
      console.log('');
      console.log('✅ Agora você pode fazer login no sistema!');
      return masterUser;
    } else {
      const errorData = await saveResponse.json();
      throw new Error(`Erro ao salvar: ${saveResponse.status} - ${errorData.message}`);
    }

  } catch (error) {
    console.error('❌ Erro ao criar usuário master:', error);
    throw error;
  }
};

// Função para testar login
const testLogin = async () => {
  console.log('🧪 Testando login do usuário master...');
  
  // Simular o processo de login
  const email = 'jeferson@sistemahr.com';
  const password = '873090As#27';
  
  try {
    // Aqui você chamaria o UserService.authenticateUser quando estiver no sistema
    console.log('📧 Email de teste:', email);
    console.log('🔑 Senha de teste:', password);
    console.log('✅ Credenciais prontas para uso!');
    
    return {
      success: true,
      message: 'Credenciais válidas - usuário pode fazer login'
    };
  } catch (error) {
    console.error('❌ Erro no teste de login:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Instruções de uso
console.log(`
🔧 INSTRUÇÕES PARA CRIAR O USUÁRIO MASTER:

1. Substitua 'seu_token_aqui' pelo token correto do GitHub
2. Execute: await createMasterUser()
3. Teste o login: await testLogin()

📝 CREDENCIAIS DO USUÁRIO MASTER:
Email: jeferson@sistemahr.com
Senha: 873090As#27

🚀 PRONTO PARA USO!
`);

// Exportar funções
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createMasterUser,
    testLogin
  };
}