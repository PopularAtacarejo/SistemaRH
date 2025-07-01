# Sistema RH Moderno

Sistema completo de gestão de recursos humanos com armazenamento de dados no GitHub para máxima portabilidade e colaboração.

## 🚀 Funcionalidades

### 📊 Dashboard Completo
- Estatísticas em tempo real
- Gráficos interativos
- Filtros avançados
- Exportação de dados

### 👥 Gestão de Candidatos
- Carregamento automático de currículos
- Acompanhamento de status
- Sistema de comentários
- Histórico completo de mudanças

### 🤖 Análise Inteligente
- IA para análise de currículos
- Matching automático de vagas
- Ranking de candidatos
- Sugestões personalizadas

### 🔔 Sistema de Lembretes
- Lembretes automáticos (45 e 90 dias)
- Lembretes manuais personalizados
- Notificações por prioridade
- Acompanhamento de vencimentos

### 👤 Gestão de Usuários
- Controle de acesso por roles
- Autenticação segura
- Gerenciamento de permissões
- Auditoria de ações

### 🌐 Recursos Avançados
- Sincronização em tempo real com GitHub
- Modo offline com cache
- Dark mode
- Interface responsiva
- Backup automático no GitHub

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: GitHub API (armazenamento de dados)
- **Gráficos**: Chart.js
- **Ícones**: Lucide React
- **Build**: Vite

## 📋 Pré-requisitos

1. **Conta GitHub**
   - Acesse [github.com](https://github.com)
   - Crie um repositório para armazenar os dados
   - Gere um Personal Access Token

2. **Node.js 18+**

## 🚀 Configuração

### 1. Configurar GitHub

1. **Criar repositório no GitHub**
   - Crie um repositório público ou privado
   - Anote o nome do proprietário e repositório

2. **Gerar Personal Access Token**:
   - Vá em Settings > Developer settings > Personal access tokens
   - Gere um token com permissões de `repo`
   - Anote o token gerado

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# GitHub Configuration for Data Storage
VITE_GITHUB_TOKEN=seu_github_token_aqui
VITE_GITHUB_OWNER=seu_usuario_github
VITE_GITHUB_REPO=nome_do_repositorio
VITE_GITHUB_BRANCH=main
```

### 3. Instalar e Executar

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 👥 Usuários e Permissões

### Roles Disponíveis

- **Administrador**: Acesso total, gestão de usuários
- **Gerente RH**: Gestão completa de candidatos
- **Analista RH**: Análise e avaliação de candidatos
- **Assistente RH**: Visualização e comentários básicos
- **Convidado**: Apenas visualização

### 🔑 Credenciais de Acesso

#### Administrador Principal
- **Nome**: Jeferson
- **Email**: `jeferson@sistemahr.com`
- **Senha**: `873090As#`
- **Role**: Administrador
- **Departamento**: Desenvolvimento
- **WhatsApp**: (82) 99915-8412

#### Usuários de Demonstração

**Administrador Sistema:**
- **Email**: `admin@empresa.com`
- **Senha**: `admin123`
- **Role**: Administrador

**Gerente RH:**
- **Email**: `gerente.rh@empresa.com`
- **Senha**: `gerente123`
- **Role**: Gerente RH

**Analista RH:**
- **Email**: `analista.rh@empresa.com`
- **Senha**: `analista123`
- **Role**: Analista RH

**Assistente RH:**
- **Email**: `assistente.rh@empresa.com`
- **Senha**: `assistente123`
- **Role**: Assistente RH

**Convidado:**
- **Email**: `convidado@empresa.com`
- **Senha**: `convidado123`
- **Role**: Convidado

## 📊 Estrutura de Dados no GitHub

### Arquivos de Dados

- `dados.json` - Candidatos/Currículos
- `usuarios.json` - Usuários do sistema
- `comentarios.json` - Comentários dos candidatos
- `lembretes.json` - Lembretes automáticos e manuais

### Segurança

- Dados armazenados em formato JSON
- Controle de acesso via GitHub
- Versionamento automático de mudanças
- Backup completo no repositório

## 🔄 Sincronização

### Tempo Real
- Mudanças salvas automaticamente no GitHub
- Cache local para performance
- Sincronização automática a cada 30 segundos

### Modo Offline
- Cache local automático
- Sincronização ao reconectar
- Backup de segurança

## 📱 Responsividade

- Design mobile-first
- Breakpoints otimizados
- Interface adaptativa
- Touch-friendly

## 🎨 Temas

- Modo claro/escuro
- Transições suaves
- Cores consistentes
- Acessibilidade

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run preview  # Preview build
npm run lint     # Linting
```

### Estrutura de Pastas

```
src/
├── components/     # Componentes React
├── contexts/       # Contextos (Auth, etc)
├── services/       # Serviços (GitHub, Candidates, Users)
├── types/          # Tipos TypeScript
└── utils/          # Utilitários
```

## 📈 Performance

- Lazy loading de componentes
- Cache inteligente
- Otimização de requests
- Compressão de assets

## 🔒 Segurança

- Autenticação baseada em email/senha
- Controle de acesso por roles
- Dados versionados no GitHub
- Tokens seguros

## 🚀 Deploy

### Netlify (Recomendado)

1. Conecte o repositório
2. Configure as variáveis de ambiente
3. Deploy automático

### Vercel

1. Importe o projeto
2. Configure as variáveis
3. Deploy

## 📞 Suporte

Para dúvidas ou suporte:

- **Administrador**: Jeferson
- **Email**: jeferson@sistemahr.com
- **WhatsApp**: (82) 99915-8412

## 📄 Licença

Este projeto é proprietário e confidencial.

## 🌟 Vantagens do GitHub Storage

- **Portabilidade**: Dados acessíveis de qualquer lugar
- **Versionamento**: Histórico completo de mudanças
- **Colaboração**: Múltiplos desenvolvedores podem contribuir
- **Backup**: Dados seguros e versionados
- **Gratuito**: Sem custos de banco de dados
- **Transparência**: Dados visíveis e auditáveis