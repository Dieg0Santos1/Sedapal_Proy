import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sedapal-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sedapal-blue mx-auto"></div>
          <p className="mt-4 text-sedapal-darkGray">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
