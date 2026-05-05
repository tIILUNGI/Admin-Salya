import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());

  // --- MOCK DATA ---
  let companies = [
    { 
      id: "1", 
      name: "Alpha Tech", 
      plan: "Anual", 
      status: "active", 
      createdAt: "2024-01-10T10:00:00Z", 
      trial: false,
      employees: 45,
      email: "contact@alphatech.ao",
      phone: "+244 923 000 111",
      nif: "5401234567",
      address: "Luanda, Talatona"
    },
    { 
      id: "2", 
      name: "Beta Solutions", 
      plan: "Mensal", 
      status: "active", 
      createdAt: "2024-02-15T10:00:00Z", 
      trial: true,
      employees: 12,
      email: "rh@beta.ao",
      phone: "+244 931 222 333",
      nif: "5412345678",
      address: "Benguela, Centro"
    },
    { 
      id: "3", 
      name: "Gamma Corp", 
      plan: "Semestral", 
      status: "suspended", 
      createdAt: "2023-11-20T10:00:00Z", 
      trial: false,
      employees: 120,
      email: "admin@gamma.ao",
      phone: "+244 944 555 666",
      nif: "5423456789",
      address: "Huambo, Cidade Alta"
    },
  ];

  let adminProfile = {
    name: "Lucian Alfred",
    email: "admin@salya.com",
    role: "Super Admin",
    avatar: null
  };

  let users = [
    { id: "u1", name: "Admin Alpha", email: "admin@alpha.com", companyId: "1", role: "ADMIN", status: "active", phone: "+244 900 111 222" },
    { id: "u2", name: "Dev Beta", email: "dev@beta.com", companyId: "2", role: "USER", status: "active", phone: "+244 900 333 444" },
    { id: "u3", name: "Suspended User", email: "user@gamma.com", companyId: "3", role: "USER", status: "blocked", phone: "+244 900 555 666" },
  ];

  let plans = [
    { id: "p1", name: "Mensal", price: 10000, durationDays: 30, isActive: true },
    { id: "p2", name: "Semestral", price: 55000, durationDays: 180, isActive: true },
    { id: "p3", name: "Anual", price: 100000, durationDays: 365, isActive: true },
  ];

  let subscriptions = [
    { id: "s1", companyId: "1", planId: "p3", startDate: "2024-01-10", endDate: "2025-01-10", isTrial: false, status: "active" },
    { id: "s2", companyId: "2", planId: "p1", startDate: "2024-05-01", endDate: "2024-06-01", isTrial: true, status: "active" },
    { id: "s3", companyId: "3", planId: "p2", startDate: "2023-11-20", endDate: "2024-05-20", isTrial: false, status: "suspended" },
  ];

  let payments = [
    { id: "PAY-9931", subscriptionId: "s1", amount: 100000, method: "Multicaixa Express", date: "2024-01-10", status: "completed" },
    { id: "PAY-2210", subscriptionId: "s2", amount: 0, method: "Cortesia (Trial)", date: "2024-05-01", status: "completed" },
  ];

  let logs = [
    { 
      id: "l1", 
      user: "Lucian Alfred", 
      action: "LOGIN", 
      details: "Iniciou sessão administrativa a partir do IP 192.168.1.1", 
      timestamp: new Date().toISOString() 
    },
    { 
      id: "l2", 
      user: "Lucian Alfred", 
      action: "COMPANY_UPDATE", 
      details: "Status da empresa Gamma Corp alterado para SUSPENDED", 
      timestamp: new Date().toISOString() 
    },
  ];

  // --- API ROUTES ---

  // Auth
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@salya.com" && password === "admin123") {
      res.json({ token: "mock-jwt-token", user: adminProfile });
    } else {
      res.status(401).json({ message: "Credenciais inválidas" });
    }
  });

  app.get("/api/admin/profile", (req, res) => res.json(adminProfile));
  app.put("/api/admin/profile", (req, res) => {
    adminProfile = { ...adminProfile, ...req.body };
    res.json(adminProfile);
  });

  app.get("/api/admin/dashboard", (req, res) => {
    res.json({
      metrics: {
        totalCompanies: companies.length,
        totalUsers: users.length,
        activeSubscriptions: subscriptions.filter(s => s.status === "active").length,
        expiredSubscriptions: subscriptions.filter(s => s.status === "expired" || s.status === "suspended").length,
        annualRevenue: payments.reduce((acc, p) => acc + p.amount, 0),
        monthlyRevenue: 1250000,
        activeTrials: subscriptions.filter(s => s.isTrial && s.status === "active").length,
      },
      revenueChart: [
        { name: "Jan", value: 800000 },
        { name: "Fev", value: 950000 },
        { name: "Mar", value: 1100000 },
        { name: "Abr", value: 1250000 },
        { name: "Mai", value: 1300000 },
      ]
    });
  });

  // Users CRUD
  app.get("/api/admin/users", (req, res) => res.json(users));
  
  app.post("/api/admin/users", (req, res) => {
    const { name, email, role, status, phone, companyId } = req.body;
    const newUser = { 
      id: `u${users.length + 1}`, 
      name, 
      email, 
      role: role || "USER", 
      status: status || "active", 
      phone: phone || "", 
      companyId: companyId || "" 
    };
    users.push(newUser);
    logs.unshift({ 
      id: `l${Date.now()}`, 
      user: adminProfile.name, 
      action: "USER_CREATE", 
      details: `Novo usuário criado: ${newUser.name}`, 
      timestamp: new Date().toISOString() 
    });
    res.status(201).json(newUser);
  });
  
  app.put("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...req.body };
      res.json(users[idx]);
    } else res.status(404).send();
  });

  app.post("/api/admin/users/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = users.find(u => u.id === id);
    if (user) {
      user.status = status;
      logs.unshift({ 
        id: `l${Date.now()}`, 
        user: adminProfile.name, 
        action: "USER_MANAGEMENT", 
        details: `Usuário ${user.email} ${status === 'active' ? 'desbloqueado' : 'bloqueado'}`, 
        timestamp: new Date().toISOString() 
      });
      res.json(user);
    } else res.status(404).send();
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    const user = users.find(u => u.id === id);
    users = users.filter(u => u.id !== id);
    logs.unshift({ 
      id: `l${Date.now()}`, 
      user: adminProfile.name, 
      action: "USER_DELETE", 
      details: `Usuário removido: ${user?.name || id}`, 
      timestamp: new Date().toISOString() 
    });
    res.status(204).send();
  });

  // Companies CRUD
  app.get("/api/admin/companies", (req, res) => res.json(companies));
  
  app.post("/api/admin/companies", (req, res) => {
    const newCompany = { ...req.body, id: `c${companies.length + 1}` };
    companies.push(newCompany);
    logs.unshift({ 
      id: `l${Date.now()}`, 
      user: adminProfile.name, 
      action: "COMPANY_CREATE", 
      details: `Nova empresa criada: ${newCompany.name}`, 
      timestamp: new Date().toISOString() 
    });
    res.status(201).json(newCompany);
  });
  
  app.get("/api/admin/companies/:id", (req, res) => {
    const company = companies.find(c => c.id === req.params.id);
    if (company) res.json(company);
    else res.status(404).send();
  });

  app.put("/api/admin/companies/:id", (req, res) => {
    const { id } = req.params;
    const idx = companies.findIndex(c => c.id === id);
    if (idx !== -1) {
      companies[idx] = { ...companies[idx], ...req.body };
      logs.unshift({ 
        id: `l${Date.now()}`, 
        user: adminProfile.name, 
        action: "COMPANY_UPDATE", 
        details: `Empresa atualizada: ${companies[idx].name}`, 
        timestamp: new Date().toISOString() 
      });
      res.json(companies[idx]);
    } else res.status(404).send();
  });

  app.post("/api/admin/companies/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const company = companies.find(c => c.id === id);
    if (company) {
      company.status = status;
      logs.unshift({ 
        id: `l${Date.now()}`, 
        user: adminProfile.name, 
        action: "COMPANY", 
        details: `Status da empresa ${company.name} alterado para ${status}`, 
        timestamp: new Date().toISOString() 
      });
      res.json(company);
    } else res.status(404).send();
  });

  app.delete("/api/admin/companies/:id", (req, res) => {
    const { id } = req.params;
    const company = companies.find(c => c.id === id);
    companies = companies.filter(c => c.id !== id);
    logs.unshift({ 
      id: `l${Date.now()}`, 
      user: adminProfile.name, 
      action: "COMPANY", 
      details: `Empresa removida: ${company?.name || id}`, 
      timestamp: new Date().toISOString() 
    });
    res.status(204).send();
  });

  // Plans CRUD
  app.get("/api/admin/plans", (req, res) => res.json(plans));
  app.post("/api/admin/plans", (req, res) => {
    const newPlan = { ...req.body, id: `p${plans.length + 1}` };
    plans.push(newPlan);
    logs.unshift({ 
      id: `l${Date.now()}`,
      user: adminProfile.name,
      action: `Novo plano criado: ${newPlan.name}`,
      details: `Plano ${newPlan.name} criado com preço ${newPlan.price}`,
      timestamp: new Date().toISOString()
    });
    res.status(201).json(newPlan);
  });
  app.put("/api/admin/plans/:id", (req, res) => {
    const { id } = req.params;
    const idx = plans.findIndex(p => p.id === id);
    if (idx !== -1) {
      plans[idx] = { ...plans[idx], ...req.body };
      res.json(plans[idx]);
    } else res.status(404).send();
  });
  app.delete("/api/admin/plans/:id", (req, res) => {
    plans = plans.filter(p => p.id !== req.params.id);
    res.status(204).send();
  });

  // Subscriptions & Payments
  app.get("/api/admin/subscriptions", (req, res) => res.json(subscriptions));
  app.get("/api/admin/payments", (req, res) => res.json(payments));
  app.post("/api/admin/payments/:id/confirm", (req, res) => {
    const pay = payments.find(p => p.id === req.params.id);
    if (pay) {
      pay.status = "completed";
      res.json(pay);
    } else res.status(404).send();
  });

  app.get("/api/admin/logs", (req, res) => res.json(logs));

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
