import { ReactNode, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AdminLayout from "./components/layout/AdminLayout";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Carregamento dinâmico por rota (Code-Splitting) no Admin
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Companies = lazy(() => import("./pages/Companies"));
const Users = lazy(() => import("./pages/Users"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Payments = lazy(() => import("./pages/Payments"));
const Plans = lazy(() => import("./pages/Plans"));
const Logs = lazy(() => import("./pages/Logs"));
const Leads = lazy(() => import("./pages/Leads"));
const Profile = lazy(() => import("./pages/Profile"));
const Vouchers = lazy(() => import("./pages/Vouchers"));

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-700 border-t-transparent"></div>
                  <p className="text-xs font-semibold text-slate-500">A carregar painel admin...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="companies" element={<Companies />} />
                  <Route path="users" element={<Users />} />
                  <Route path="subscriptions" element={<Subscriptions />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="plans" element={<Plans />} />
                  <Route path="vouchers" element={<Vouchers />} />
                  <Route path="logs" element={<Logs />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
