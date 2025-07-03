#!/usr/bin/env node

const https = require('https');

console.log('🔧 TESTANDO NOVO TOKEN GITHUB...\n');

const GITHUB_TOKEN = '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';
const REPO_OWNER = 'PopularAtacarejo';
const REPO_NAME = 'SistemaRH';

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testRepositoryAccess() {
  console.log('📡 1. Testando acesso ao repositório SistemaRH...');
  
  try {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sistema-RH-Test'
      }
    };

    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const repo = JSON.parse(response.data);
      console.log('✅ REPOSITÓRIO ACESSÍVEL!');
      console.log(`📂 Nome: ${repo.name}`);
      console.log(`🔒 Privado: ${repo.private}`);
      console.log(`📊 Última atualização: ${repo.updated_at}`);
      console.log(`🌐 URL: ${repo.html_url}`);
      return true;
    } else {
      console.log(`❌ Erro de acesso: ${response.statusCode}`);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

async function createUserMaster() {
  console.log('\n👑 2. Criando usuário master Jeferson...');
  
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

  try {
    const content = Buffer.from(JSON.stringify([masterUser], null, 2)).toString('base64');
    
    const body = JSON.stringify({
      message: `Criação do usuário master Jeferson - ${new Date().toISOString()}`,
      content: content,
      branch: 'main'
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/contents/usuarios.json`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Sistema-RH-Setup',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const response = await makeRequest(options);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('🎉 USUÁRIO MASTER CRIADO COM SUCESSO!');
      console.log(`📂 Arquivo: https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/usuarios.json`);
      return true;
    } else {
      console.log(`❌ Erro ao criar usuário: ${response.statusCode}`);
      console.log('Response:', JSON.parse(response.data));
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na criação:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 === CONFIGURAÇÃO SISTEMA RH ONLINE ===\n');
  
  // 1. Testar conectividade
  const accessOk = await testRepositoryAccess();
  
  if (!accessOk) {
    console.log('\n❌ Falha na conectividade. Verificar token e repositório.');
    process.exit(1);
  }
  
  // 2. Criar usuário master
  const userCreated = await createUserMaster();
  
  if (userCreated) {
    console.log('\n🎯 === CONFIGURAÇÃO CONCLUÍDA ===');
    console.log('✅ SISTEMA CONFIGURADO PARA FUNCIONAMENTO ONLINE!');
    console.log('\n📋 CREDENCIAIS:');
    console.log('📧 Email: jeferson@sistemahr.com');
    console.log('🔑 Senha: 873090As#27');
    console.log('👑 Nível: Master (todos os poderes)');
    console.log('\n🔗 Repositório: https://github.com/PopularAtacarejo/SistemaRH');
  } else {
    console.log('\n⚠️ Problemas na criação do usuário');
  }
}

main().catch(console.error);