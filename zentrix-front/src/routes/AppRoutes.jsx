import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/login";
import ResetPassword from "../pages/auth/reset-password"
import ForgotPassword from "../pages/auth/forgot-password"
import DashboardAdmin from "../pages/dashboard/admin"
import DashboardUser from "../pages/dashboard/user"

const AppRoutes = () => {
  return (
    <Router>
      <Routes>

        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Rutas protegidas (solo con sesión activa) */}
        <Route element={<Layout />}>
          <Route path="/dashboard/admin" element={<DashboardAdmin />} />
          <Route path="/dashboard/user" element={<DashboardUser />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
