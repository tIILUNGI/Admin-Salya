<div align="center">
<img width="1200" height="475" alt="Salya Admin Banner" src="https://github.com/user-attachments/assets/aa6c5f23-a291-4b2b-b2d2-a5e91461d5c2" />
</div>

# Salya Admin - Painel Administrativo Completo

**Salya Admin** é um sistema MVP totalmente funcional de administração empresarial com dashboard, gestão de usuários, empresas, subscrições, pagamentos, planos e logs de auditoria. 100% responsivo, com SweetAlert2 para alertas.

## 🚀 Funcionalidades Implementadas (MVP Completo)

### 📊 **Dashboard**
- Métricas em tempo real (empresas, usuários, receitas)
- Gráficos interativos (Recharts)
- Cards Bento responsivos

### 🏢 **Empresas** - CRUD Completo
- Listagem, criação, edição, exclusão
- Gestão de status (ativo/suspenso)
- Detalhes completos (NIF, telefone, endereço)

### 👥 **Usuários** - CRUD Completo
- Criação via modal (nome, email, role)
- Bloqueio/desbloqueio com confirmação Swal
- Reset senha (mock funcional)

### 💳 **Pagamentos & Subscrições**
- Histórico completo
- Confirmação de pagamentos
- Status trial/ativo/expirado

### 🎫 **Planos** - CRUD Completo
- Mensal, Semestral, Anual
- Criação/editação/exclusão

### 📋 **Logs de Auditoria**
- Histórico automático de todas ações
- Login, CRUD, status changes

### 🔐 **Autenticação Completa**
- Login: `admin@salya.com` / `admin123`
- JWT mock, rotas protegidas
- Register toggle no login
- "Esqueceu senha?" com Swal

## ✅ **Melhorias Implementadas**
- **100% Responsivo** mobile/tablet/desktop
- **SweetAlert2** todos alertas/confirmações
- **npm run dev** → Backend (azul) + Frontend (verde)
- Branding "Salya Admin" completo
- Sem ícones notificação extras dashboard
- Favicon e títulos atualizados

## 🛠️ Stack Técnica

```
Frontend: React 19 + TypeScript + TailwindCSS + Vite
Backend: Node.js + Express + TSX (mock API)
UI: Framer Motion + Lucide React + Recharts + SweetAlert2
```

## 🎯 Como Usar

```bash
npm install
npm run dev
```

**Frontend:** http://localhost:5173  
**Backend:** http://localhost:3001

**Login:** `admin@salya.com` / `admin123`

## 📱 Responsividade Testada
- Mobile: Stack vertical, menus colapsados
- Tablet: Grid 2-colunas  
- Desktop: Bento grid completa

## 🎉 Status: MVP 100% FUNCIONAL

**Sistema rodando perfeitamente!** Teste todos CRUD - dados persistem na sessão.


