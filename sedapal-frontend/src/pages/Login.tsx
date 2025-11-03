import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SedapalLogo from '../components/SedapalLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sedapal-cyan via-sedapal-lightBlue to-sedapal-blue px-4">
      <div className="flex items-center justify-center gap-8 max-w-5xl w-full">
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          {/* Logo y Título */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <SedapalLogo size="lg" />
            </div>
            <p className="text-sedapal-darkGray text-sm">Sistema de Gestión de Actividades</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent outline-none transition"
                placeholder="usuario@sedapal.com.pe"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sedapal-blue hover:bg-sedapal-lightBlue text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-sedapal-darkGray">
              ¿Olvidaste tu contraseña?{' '}
              <a href="#" className="text-sedapal-lightBlue hover:text-sedapal-cyan font-medium">
                Recuperar
              </a>
            </p>
          </div>
        </div>

        {/* Mascot */}
        <div className="hidden lg:block">
          <img 
            src="/assets/sedapal-mascot.png" 
            alt="Sedapal Mascot" 
            className="w-80 h-80 object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
