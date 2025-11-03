import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usuariosService } from '../services/api';

interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'superadmin' | 'admin' | 'usuario';
  estado: boolean;
}

interface AuthContextType {
  user: Usuario | null;
  session: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [session, setSession] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    const storedUser = localStorage.getItem('sedapal_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setSession(userData);
      } catch (error) {
        localStorage.removeItem('sedapal_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userData = await usuariosService.validateCredenciales(email, password);
      
      if (!userData) {
        throw new Error('Credenciales inválidas');
      }

      setUser(userData);
      setSession(userData);
      localStorage.setItem('sedapal_user', JSON.stringify(userData));
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('sedapal_user');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
