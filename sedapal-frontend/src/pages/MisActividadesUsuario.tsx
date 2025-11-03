import { ClipboardCheck, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usuarioActividadesService, entregablesService } from '../services/api';
import type { ActividadConSistema } from '../services/api';
import SedapalLogo from '../components/SedapalLogo';
import UploadModal from '../components/UploadModal';
import confetti from 'canvas-confetti';

interface MisActividadesUsuarioProps {
  idUsuario: number;
}

export default function MisActividadesUsuario({ idUsuario }: MisActividadesUsuarioProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedActividadId, setSelectedActividadId] = useState<number | null>(null);
  const [selectedActividadName, setSelectedActividadName] = useState<string>('');

  useEffect(() => {
    loadActividades();
  }, [idUsuario]);

  const loadActividades = async () => {
    try {
      setLoading(true);
      const data = await usuarioActividadesService.getActividadesByUsuario(idUsuario);
      setActividades(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar actividades: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleOpenUpload = (actividadId: number, actividadName: string) => {
    setSelectedActividadId(actividadId);
    setSelectedActividadName(actividadName);
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!selectedActividadId) return;

    try {
      await entregablesService.upload(file, selectedActividadId, idUsuario);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#0EA5E9', '#3B82F6', '#10B981']
      });
    } catch (err: any) {
      throw new Error(err.message || 'Error al subir el archivo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <SedapalLogo size="sm" />
              <h1 className="text-lg sm:text-xl font-bold text-sedapal-blue">Mis Actividades</h1>
            </div>
            <span className="text-sm text-gray-600">{user?.email}</span>
          </div>
        </header>
        <div className="p-8 flex items-center justify-center">
          <div className="text-gray-600">Cargando actividades...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <SedapalLogo size="sm" />
            <h1 className="text-lg sm:text-xl font-bold text-sedapal-blue">Mis Actividades</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.nombre} {user?.apellido}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center bg-sedapal-lightBlue hover:bg-sedapal-blue text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              <LogOut size={18} className="sm:mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <ClipboardCheck className="text-sedapal-lightBlue mr-3" size={32} />
        <h1 className="text-3xl font-bold text-sedapal-lightBlue">Mis Actividades Asignadas</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actividad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo Responsable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trimestre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Máxima</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregables</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actividades.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No tienes actividades asignadas
                </td>
              </tr>
            ) : (
              actividades.map((actividad: any) => (
                <tr key={actividad.id_actividad} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{actividad.nombre_actividad || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-cyan text-white">
                      {actividad.sistema_abrev || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {actividad.equipo_nombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-lightBlue text-white">
                      {actividad.trimestre ? `Trimestre ${actividad.trimestre}` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {actividad.fecha_sustento ? (() => {
                      const fecha = new Date(actividad.fecha_sustento + 'T00:00:00');
                      return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    })() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      actividad.estado_actividad === 'completado' ? 'bg-blue-100 text-blue-800' :
                      actividad.estado_actividad === 'reprogramado' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {actividad.estado_actividad === 'completado' ? 'Completado' :
                       actividad.estado_actividad === 'reprogramado' ? 'Reprogramado' :
                       'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenUpload(actividad.id_actividad, actividad.nombre_actividad || 'Sin nombre')}
                      className="text-white bg-sedapal-lightBlue hover:bg-sedapal-blue px-3 py-2 rounded transition flex items-center gap-1"
                      title="Subir Entregables"
                    >
                      <ClipboardCheck size={16} />
                      <span className="text-xs">Subir Entregables</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📋 <strong>Instrucciones:</strong> Revisa cada actividad asignada y sube los entregables correspondientes.
        </p>
      </div>
      </div>

      {/* Modal: Subir Entregable */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        activityName={selectedActividadName}
      />
    </div>
  );
}
