import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterAdmin from './pages/RegisterAdmin';
import MisActividadesUsuario from './pages/MisActividadesUsuario';
import { useExpiryGuard } from './hooks/useExpiryGuard';
import ExpiredScreen from './components/ExpiredScreen';

function AppRoutes() {
  const { user, loading } = useAuth();
  const { expired, expiresAt } = useExpiryGuard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (expired) {
    return <ExpiredScreen until={expiresAt} />;
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Rutas según el rol del usuario
  switch (user.rol) {
    case 'superadmin':
      // SuperAdmin ve todo
      return (
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register-admin" element={<RegisterAdmin />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      );
    
    case 'admin':
      // Admin solo ve dashboard (con sistemas delegados y sus actividades)
      return (
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      );
    
    case 'usuario':
      // Usuario ve su dashboard y sus actividades
      return (
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/actividades" element={<MisActividadesUsuario idUsuario={user.id_usuario} />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      );
    
    default:
      return (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
