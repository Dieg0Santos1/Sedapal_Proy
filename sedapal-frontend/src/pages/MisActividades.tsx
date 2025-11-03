import { ClipboardList, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminActividadesService } from '../services/api';
import type { ActividadConSistema } from '../services/api';

export default function MisActividades() {
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar todas las actividades creadas por los administradores
      const actData = await adminActividadesService.getAllActividadesFromAdmins();
      setActividades(actData);
      setError('');
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar actividades
  const actividadesFiltradas = actividades.filter(act =>
    (act.nombre_actividad?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (act.sistema_abrev?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (act.equipo_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  // Calcular paginación
  const totalPages = Math.ceil(actividadesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const actividadesPaginadas = actividadesFiltradas.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleVerEntregables = (actividadId: number) => {
    // TODO: Implementar vista de entregables
    console.log('Ver entregables de actividad:', actividadId);
    alert('Funcionalidad de Ver Entregables - Próximamente');
  };

  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case 'completado': return 'bg-blue-100 text-blue-800';
      case 'reprogramado': return 'bg-purple-100 text-purple-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string | null) => {
    switch (estado) {
      case 'completado': return 'Completado';
      case 'reprogramado': return 'Reprogramado';
      case 'pendiente': return 'Pendiente';
      default: return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando actividades...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <ClipboardList className="text-sedapal-lightBlue mr-3" size={32} />
          <h1 className="text-3xl font-bold text-sedapal-lightBlue">Actividades Creadas por Administradores</h1>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Vista de todas las actividades creadas por los administradores del sistema
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por actividad, sistema o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actividad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo Responsable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Máxima</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actividadesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay actividades creadas por administradores'}
                </td>
              </tr>
            ) : (
              actividadesPaginadas.map((actividad, index) => (
                <tr key={actividad.id_actividad} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{actividad.nombre_actividad || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-cyan text-white">
                      {actividad.sistema_abrev || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {actividad.equipo_nombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {actividad.fecha_sustento ? (() => {
                      const fecha = new Date(actividad.fecha_sustento + 'T00:00:00');
                      return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    })() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(actividad.estado_actividad)}`}>
                      {getEstadoLabel(actividad.estado_actividad)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleVerEntregables(actividad.id_actividad)}
                      className="text-white bg-sedapal-lightBlue hover:bg-sedapal-blue px-3 py-2 rounded transition flex items-center gap-1"
                      title="Ver Entregables"
                    >
                      <Eye size={16} />
                      <span className="text-xs">Ver Entregables</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, actividadesFiltradas.length)} de {actividadesFiltradas.length} resultados
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 bg-sedapal-cyan text-white rounded-lg hover:bg-sedapal-lightBlue disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </button>
            <div className="flex items-center px-4 py-2 border-2 border-sedapal-cyan rounded-lg bg-white text-sedapal-blue font-semibold">
              Página {currentPage} de {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 bg-sedapal-cyan text-white rounded-lg hover:bg-sedapal-lightBlue disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span className="hidden sm:inline mr-1">Siguiente</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
