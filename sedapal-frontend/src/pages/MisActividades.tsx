import { ClipboardList, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminActividadesService } from '../services/api';
import type { ActividadConSistema } from '../services/api';
import ViewEntregablesModal from '../components/ViewEntregablesModal';

export default function MisActividades() {
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal de entregables
  const [isEntregablesModalOpen, setIsEntregablesModalOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadConSistema | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const groupActividades = (items: any[]) => {
    const map = new Map<string, any>();
    items.forEach((a: any) => {
      const key = `${a.nombre_actividad || ''}|${a.id_sistema || ''}|${a.id_gerencia || ''}|${a.id_equipo || ''}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...a,
          actividad_ids: [a.id_actividad],
          entregables_lista: a.entregable_nombre ? [a.entregable_nombre] : [],
          usuarios_asignados: (a as any).usuarios_asignados || 0,
          trimestres: Array.isArray((a as any).trimestres) ? [...(a as any).trimestres] : (a.trimestre ? [a.trimestre] : []),
        });
      } else {
        existing.actividad_ids.push(a.id_actividad);
        if (a.entregable_nombre && !existing.entregables_lista.includes(a.entregable_nombre)) {
          existing.entregables_lista.push(a.entregable_nombre);
        }
        existing.usuarios_asignados = (existing.usuarios_asignados || 0) + ((a as any).usuarios_asignados || 0);
        const states = [existing.estado_actividad, a.estado_actividad];
        if (states.every((s: any) => s === 'completado')) existing.estado_actividad = 'completado';
        else if (states.some((s: any) => s === 'reprogramado')) existing.estado_actividad = 'reprogramado';
        else existing.estado_actividad = 'pendiente';
        existing.en_revision = existing.en_revision || a.en_revision;
        if (a.fecha_sustento && (!existing.fecha_sustento || a.fecha_sustento > existing.fecha_sustento)) {
          existing.fecha_sustento = a.fecha_sustento;
        }
        const newTrims = Array.isArray((a as any).trimestres) ? (a as any).trimestres : (a.trimestre ? [a.trimestre] : []);
        existing.trimestres = Array.from(new Set([...(existing.trimestres || []), ...newTrims])).sort();
      }
    });
    return Array.from(map.values());
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar todas las actividades creadas por los administradores
      const actData = await adminActividadesService.getAllActividadesFromAdmins();
      setActividades(groupActividades(actData));
      setError('');
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar actividades
  const actividadesFiltradas = actividades.filter(act => {
    const matchesSearch = (act.nombre_actividad?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (act.sistema_abrev?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (act.equipo_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesEstado = !filtroEstado || (filtroEstado === 'revision'
      ? ((act as any).en_revision && act.estado_actividad !== 'completado')
      : act.estado_actividad === filtroEstado);
    return matchesSearch && matchesEstado;
  });

  // Calcular paginación
  const totalPages = Math.ceil(actividadesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const actividadesPaginadas = actividadesFiltradas.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroEstado]);

  const handleVerEntregables = (actividad: ActividadConSistema) => {
    setSelectedActividad(actividad);
    setIsEntregablesModalOpen(true);
  };

  const getEstadoColor = (estado: string | null, enRevision?: boolean) => {
    if (enRevision && estado !== 'completado') return 'bg-yellow-100 text-yellow-800';
    switch (estado) {
      case 'completado': return 'bg-blue-100 text-blue-800';
      case 'reprogramado': return 'bg-purple-100 text-purple-800';
      case 'pendiente': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string | null, enRevision?: boolean) => {
    if (enRevision && estado !== 'completado') return 'En revisión';
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
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
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
        <div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="revision">En revisión</option>
            <option value="reprogramado">Reprogramado</option>
            <option value="completado">Completado</option>
          </select>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerencia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo Responsable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Máxima</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignados</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actividadesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay actividades creadas por administradores'}
                </td>
              </tr>
            ) : (
              actividadesPaginadas.map((actividad, index) => (
                <tr key={actividad.id_actividad} className="hover:bg-gray-50" style={{ borderRightWidth: 4, borderRightStyle: 'solid', borderRightColor: (actividad as any).usuarios_asignados > 0 ? '#10B981' : '#EF4444' }}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{actividad.nombre_actividad || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-cyan text-white">
                      {actividad.sistema_abrev || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-gray-100 text-gray-700">
                      {actividad.gerencia_abrev || 'N/A'}
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
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(actividad.estado_actividad, (actividad as any).en_revision)}`}>
                      {getEstadoLabel(actividad.estado_actividad, (actividad as any).en_revision)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={(actividad as any).usuarios_asignados > 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                      {(actividad as any).usuarios_asignados || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleVerEntregables(actividad)}
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
      
      {/* Modal: Ver Entregables */}
      {selectedActividad && (
        <ViewEntregablesModal
          isOpen={isEntregablesModalOpen}
          onClose={() => setIsEntregablesModalOpen(false)}
          entregableNombre={selectedActividad.entregable_nombre}
          entregablesNombres={(selectedActividad as any).entregables_lista}
          activityName={selectedActividad.nombre_actividad}
          activityMaxDate={selectedActividad.fecha_sustento || null}
          activityCompletionStatus={selectedActividad.estado_actividad || null}
          onChangeStatus={async () => {}}
          isAdmin={false}
        />
      )}
    </div>
  );
}
