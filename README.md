# Sistema RH Moderno

Sistema completo de gestão de recursos humanos com integração Supabase para colaboração em tempo real.

## 🚀 Funcionalidades

### 📊 Dashboard Completo
- Estatísticas em tempo real
- Gráficos interativos
- Filtros avançados
- Exportação de dados

### 👥 Gestão de Candidatos
- Importação automática de currículos
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
- Sincronização em tempo real
- Modo offline com cache
- Dark mode
- Interface responsiva
- Backup automático

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Gráficos**: Chart.js
- **Ícones**: Lucide React
- **Build**: Vite

## 📋 Pré-requisitos

1. **Conta Supabase**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e a chave anônima

2. **Node.js 18+**

## 🚀 Configuração

### 1. Configurar Supabase

1. **Criar projeto no Supabase**
2. **Executar migrations**:
   - Acesse o SQL Editor no painel do Supabase
   - Execute o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`

3. **Configurar autenticação**:
   - Vá em Authentication > Settings
   - Desabilite "Enable email confirmations"
   - Configure providers conforme necessário

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
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

## 📊 Estrutura do Banco

### Tabelas Principais

- `users` - Usuários do sistema
- `candidates` - Candidatos/Currículos
- `comments` - Comentários dos candidatos
- `reminders` - Lembretes automáticos e manuais

### Segurança

- Row Level Security (RLS) habilitado
- Políticas baseadas em roles
- Auditoria completa de mudanças

## 🔄 Sincronização

### Tempo Real
- Mudanças sincronizadas instantaneamente
- Notificações de atualizações
- Resolução automática de conflitos

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
├── lib/           # Configurações (Supabase)
├── services/      # Serviços de API
├── types/         # Tipos TypeScript
└── utils/         # Utilitários
```

## 📈 Performance

- Lazy loading de componentes
- Otimização de queries
- Cache inteligente
- Compressão de assets

## 🔒 Segurança

- Autenticação JWT
- Criptografia de dados
- Validação de entrada
- Sanitização de dados

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