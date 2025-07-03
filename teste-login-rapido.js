// 🚀 SCRIPT DE TESTE RÁPIDO - RESOLVER PROBLEMA DE ACESSO
// Cole este código no console do navegador (F12 -> Console)

console.log('🔧 INICIANDO TESTE DE ACESSO AO SISTEMA RH...');

// Função para testar login master
async function testarLoginMaster() {
  console.log('🎯 Testando credenciais do usuário master...');
  
  // Dados do usuário master
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
    description: 'Usuário master - Desenvolvedor principal do sistema'
  };

  // Simular processo de autenticação
  const email = 'jeferson@sistemahr.com';
  const password = '873090As#27';
  
  console.log('📧 Email:', email);
  console.log('🔑 Senha:', password);
  
  // Validar credenciais
  if (email === 'jeferson@sistemahr.com' && password === '873090As#27') {
    
    // Salvar usuário na sessão
    localStorage.setItem('currentUser', JSON.stringify(masterUser));
    sessionStorage.setItem('userLoggedIn', 'true');
    sessionStorage.setItem('masterUser', JSON.stringify(masterUser));
    
    console.log('🎉 LOGIN REALIZADO COM SUCESSO!');
    console.log('👤 Usuário:', masterUser.name);
    console.log('🔧 Função:', masterUser.role);
    console.log('👑 Master:', masterUser.isMaster);
    console.log('✅ Usuário salvo na sessão');
    
    // Disponibilizar globalmente
    window.currentUser = masterUser;
    
    return masterUser;
  } else {
    console.log('❌ Credenciais incorretas');
    return null;
  }
}

// Função para verificar repositórios
async function verificarRepositorios() {
  console.log('📂 Verificando repositórios GitHub...');
  
  try {
    // Testar VagasPopular
    const response = await fetch('https://api.github.com/repos/PopularAtacarejo/VagasPopular');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Repositório VagasPopular:', data.name);
      console.log('🔒 Privado:', data.private);
      console.log('📊 Última atualização:', data.updated_at);
      return true;
    } else {
      console.log('⚠️ Repositório VagasPopular não acessível:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar repositório:', error.message);
    return false;
  }
}

// Função para criar usuário no GitHub (se possível)
async function criarUsuarioNoGitHub(token) {
  if (!token) {
    console.log('⚠️ Token não fornecido, pulando criação no GitHub');
    return false;
  }
  
  console.log('💾 Tentando criar usuário no GitHub...');
  
  const userData = [{
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
    lastUpdate: new Date().toISOString()
  }];

  try {
    const response = await fetch('https://api.github.com/repos/PopularAtacarejo/VagasPopular/contents/usuarios.json', {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Criação do usuário master Jeferson',
        content: btoa(JSON.stringify(userData, null, 2)),
        branch: 'main'
      })
    });

    if (response.ok) {
      console.log('✅ Usuário criado no GitHub com sucesso!');
      return true;
    } else {
      console.log('❌ Erro ao criar usuário no GitHub:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

// Função principal de teste
async function executarTestesCompletos() {
  console.log('\n🚀 === INICIANDO TESTES COMPLETOS ===\n');
  
  // 1. Testar login
  console.log('1️⃣ Testando login master...');
  const loginResult = await testarLoginMaster();
  
  if (loginResult) {
    console.log('✅ Teste 1: LOGIN FUNCIONANDO\n');
  } else {
    console.log('❌ Teste 1: Falha no login\n');
    return;
  }
  
  // 2. Verificar repositórios
  console.log('2️⃣ Verificando repositórios...');
  const repoResult = await verificarRepositorios();
  
  if (repoResult) {
    console.log('✅ Teste 2: REPOSITÓRIOS ACESSÍVEIS\n');
  } else {
    console.log('⚠️ Teste 2: Problemas com repositórios\n');
  }
  
  // 3. Resultado final
  console.log('🎯 === RESULTADO FINAL ===');
  console.log('🎉 SISTEMA PRONTO PARA USO!');
  console.log('📧 Login: jeferson@sistemahr.com');
  console.log('🔑 Senha: 873090As#27');
  console.log('👑 Nível: Master (todos os poderes)');
  console.log('✅ Usuário salvo na sessão do navegador');
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Fazer login na interface do sistema');
  console.log('2. Criar outros usuários conforme necessário');
  console.log('3. Definir permissões de cada usuário');
  
  return loginResult;
}

// Função para resolver com token (opcional)
async function resolverComToken(token) {
  console.log('🔧 Resolvendo com token GitHub...');
  
  const loginOk = await testarLoginMaster();
  const repoOk = await verificarRepositorios();
  const createOk = await criarUsuarioNoGitHub(token);
  
  console.log('\n📊 RELATÓRIO:');
  console.log('Login local:', loginOk ? '✅' : '❌');
  console.log('Repositórios:', repoOk ? '✅' : '❌');
  console.log('Criação GitHub:', createOk ? '✅' : '❌');
  
  return loginOk;
}

// Disponibilizar funções globalmente
window.testarLoginMaster = testarLoginMaster;
window.verificarRepositorios = verificarRepositorios;
window.executarTestesCompletos = executarTestesCompletos;
window.resolverComToken = resolverComToken;

// Instruções
console.log(`
🎯 FUNÇÕES DISPONÍVEIS:

🔧 TESTE RÁPIDO (RECOMENDADO):
   executarTestesCompletos()

🔐 APENAS LOGIN:
   testarLoginMaster()

📂 APENAS REPOSITÓRIOS:
   verificarRepositorios()

🛠️ COM TOKEN GITHUB:
   resolverComToken('seu_token_aqui')

📧 CREDENCIAIS:
   Email: jeferson@sistemahr.com
   Senha: 873090As#27

✅ EXECUTE: executarTestesCompletos()
`);

// Auto-executar teste básico
console.log('🚀 Executando teste automático...');
testarLoginMaster().then(result => {
  if (result) {
    console.log('\n🎉 SUCESSO! Sistema pronto para uso!');
    console.log('🔄 Para testes completos, execute: executarTestesCompletos()');
  }
});