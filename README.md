# ELMASICO CONNECT — Plataforma Inteligente de Serviços Digitais

> **“Conectando você aos serviços.”**

ELMASICO CONNECT é uma plataforma web empresarial completa para assistência e gestão de serviços públicos e privados em Angola (AGT, SME, GUE, Viação e Trânsito, SILAC, Educação, SEPE e Serviços Consulares).

---

## 🚀 Arquitetura & Stack Técnica

### **Frontend**
- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS** (design responsivo, mobile-first, paleta corporativa: azul escuro `#0f172a`, azul `#2563eb`, destaques em laranja `#ea580c` e cinzas neutros)
- **React Router v7**
- **Lucide React** & **Recharts**
- **SweetAlert2** (módulos de notificação e confirmação)

### **Backend & Banco de Dados**
- **Supabase** & **PostgreSQL**
- **Supabase Auth** (Role Level Access: `CLIENT`, `OPERATOR`, `SUPERVISOR`, `ADMIN`)
- **Row Level Security (RLS)** ativo em 100% das tabelas
- **Supabase Storage** (buckets privados com URLs temporárias/assinadas)
- **Supabase Edge Functions**:
  - `ai-assistant`: Integração com Provedor de IA
  - `notifications`: Notificações do sistema
  - `payment`: Processamento de pagamentos
  - `integrations`: Conectores externos
  - `whatsapp`: Webhook para WhatsApp Business Cloud API

---

## 📦 Estrutura do Projeto

```
src/
├── assets/
├── components/
│   ├── layout/       # ClientLayout, StaffLayout, AdminLayout, ProtectedRoutes
│   ├── ui/
│   ├── forms/
│   ├── documents/
│   ├── processes/
│   ├── payments/
│   ├── notifications/
│   └── charts/
├── pages/
│   ├── public/       # LandingPage, ServicesCatalogPage, ServiceDetailPage
│   ├── auth/         # LoginPage, RegisterPage, ForgotPasswordPage
│   ├── client/       # ClientDashboard, AIChat, ProcessDetail, Notifications, Profile
│   ├── operator/     # OperatorDashboard
│   ├── supervisor/   # SupervisorDashboard
│   └── admin/        # AdminDashboard, Users, Services, Integrations, Reports, AuditLogs, Settings
├── contexts/         # AuthContext
├── services/         # mockDataService, integrationProviders
├── lib/              # supabase.ts
├── types/            # database.ts
└── App.tsx

supabase/
├── migrations/
│   ├── 20260101000000_schema.sql
│   └── 20260101000001_rls.sql
├── functions/
│   ├── ai-assistant/
│   ├── notifications/
│   ├── payment/
│   ├── integrations/
│   └── whatsapp/
└── seed.sql
```

---

## 🔐 Segurança & Auditoria

1. **Separação de Chaves**: Nenhuma Service Role Key exposta no frontend.
2. **Geração de Número de Processo**: Sequência transacional segura no banco de dados gerando o formato `EC-2026-000001`.
3. **Validação de Documentos**: Verificação de extensões (`.pdf`, `.jpg`, `.jpeg`, `.png`), tamanho máximo (10MB) e estados (`PENDING_REVIEW`, `ACCEPTED`, `REJECTED`, `MISSING`).
4. **Modo de Assistência Manual**: Quando uma entidade governamental não disponibiliza API pública oficial, o sistema funciona em modo de assistência manual por operador técnico qualificado.
5. **Audit Logs**: Registo de todas as ações administrativas e sensíveis.

---

## 🛠️ Como Executar

### **1. Instalação de Dependências**
```bash
npm install
```

### **2. Configuração de Variáveis de Ambiente**
Copie o ficheiro `.env.example` para `.env`:
```bash
cp .env.example .env
```

Preencha com as credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://sua-instancia.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### **3. Executar o Servidor de Desenvolvimento**
```bash
npm run dev
```

### **4. Verificação de Tipos e Build de Produção**
```bash
npm run lint
npm run build
```

---

## 🔑 Credenciais para Demonstração

No ecrã de login, utilize os botões de **Acesso Rápido para Demonstração** ou as seguintes contas:

- **Cliente:** `cliente@elmasico.co.ao`
- **Operador:** `operador@elmasico.co.ao`
- **Supervisor:** `supervisor@elmasico.co.ao`
- **Administrador:** `admin@elmasico.co.ao`

---

## 📄 Licença & Propriedade
© 2026 **ELMASICO CONNECT** — Todos os direitos reservados.
