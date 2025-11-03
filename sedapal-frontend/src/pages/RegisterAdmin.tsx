import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import SedapalLogo from '../components/SedapalLogo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface AdminCreated {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  contrasena: string;
  rol: string;
}

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminCreated, setAdminCreated] = useState<AdminCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/usuarios/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          idSistema: 1, // Valor por defecto
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear administrador');
      }

      const data = await response.json();
      setAdminCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear administrador');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (adminCreated?.contrasena) {
      navigator.clipboard.writeText(adminCreated.contrasena);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleCreateAnother = () => {
    setAdminCreated(null);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
    });
    setError('');
  };

  if (adminCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sedapal-blue to-sedapal-lightBlue flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <SedapalLogo size="lg" />
          </div>

          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Administrador Creado!
            </h1>
            <p className="text-gray-600">
              Guarda esta información, es importante
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Nombre completo</p>
              <p className="font-semibold text-gray-800">
                {adminCreated.nombre} {adminCreated.apellido}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Correo electrónico</p>
              <p className="font-semibold text-gray-800">{adminCreated.email}</p>
            </div>

            <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg">
              <p className="text-sm text-green-700 mb-1 font-medium">Contraseña generada</p>
              <div className="flex items-center justify-between">
                <p className="font-bold text-green-800 text-lg">
                  {adminCreated.contrasena}
                </p>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 hover:bg-green-100 rounded-lg transition"
                  title="Copiar contraseña"
                >
                  <Copy className={copied ? 'text-green-600' : 'text-green-700'} size={20} />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 mt-2">¡Copiado!</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              className="w-full bg-sedapal-blue hover:bg-sedapal-lightBlue text-white py-3 rounded-lg font-medium transition"
            >
              Ir al Login
            </button>
            <button
              onClick={handleCreateAnother}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition"
            >
              Crear otro administrador
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Importante:</strong> Esta contraseña solo se muestra una vez. 
              Asegúrate de guardarla o enviarla al administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sedapal-blue to-sedapal-lightBlue flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-sedapal-blue mb-4 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver
        </button>

        <div className="flex justify-center mb-6">
          <SedapalLogo size="lg" />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Crear Administrador
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Ingresa los datos del nuevo administrador
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-cyan focus:border-transparent"
              placeholder="Juan"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido
            </label>
            <input
              type="text"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-cyan focus:border-transparent"
              placeholder="Pérez"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-cyan focus:border-transparent"
              placeholder="juan.perez@sedapal.com.pe"
              required
              disabled={loading}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sedapal-blue hover:bg-sedapal-lightBlue text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Formato de contraseña:</strong> Admin + Primera letra del nombre + 
            Primera letra del apellido + 2 números al azar
            <br />
            <span className="text-blue-600">Ejemplo: AdminJP42</span>
          </p>
        </div>
      </div>
    </div>
  );
}
