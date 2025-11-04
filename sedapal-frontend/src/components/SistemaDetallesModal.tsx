import { useState, useEffect } from 'react';
import { X, Activity, Users, TrendingUp, Calendar } from 'lucide-react';
import Modal from './Modal';
import { sistemaStatsService } from '../services/api';
import type { ActividadConSistema, Usuario } from '../services/api';

interface SistemaDetallesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sistemaId: number;
  sistemaNombre: string;
  sistemaAbrev: string;
}

export default function SistemaDetallesModal({ 
  isOpen, 
  onClose, 
  sistemaId,
  sistemaNombre,
  sistemaAbrev 
}: SistemaDetallesModalProps) {
  const [loading, setLoading] = useState(true);
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [actividadesPorTrimestre, setActividadesPorTrimestre] = useState<{ trimestre: number; cantidad: number }[]>([]);
  const [actividadesPorEstado, setActividadesPorEstado] = useState<{ estado: string; cantidad: number }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEstadisticas();
    }
  }, [isOpen, sistemaId]);

  const loadEstadisticas = async () => {
    try {
      setLoading(true);
      setError('');
      const stats = await sistemaStatsService.getEstadisticas(sistemaId);
      setActividades(stats.actividades);
      setUsuarios(stats.usuarios);
      setActividadesPorTrimestre(stats.actividadesPorTrimestre);
      setActividadesPorEstado(stats.actividadesPorEstado);
    } catch (err: any) {
      setError('Error al cargar estadísticas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'conforme': return 'bg-green-500';
      case 'no conforme': return 'bg-red-500';
      case 'pendiente': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'conforme': return 'Conforme';
      case 'no conforme': return 'No Conforme';
      case 'pendiente': return 'Pendiente';
      default: return estado;
    }
  };

  const maxActividades = Math.max(...actividadesPorTrimestre.map(t => t.cantidad), 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalles del Sistema: ${sistemaAbrev}`} size="xl">
      <div className="space-y-6">
        {/* Header con nombre completo */}
        <div className="bg-sedapal-lightBlue text-white rounded-lg p-4">
          <h2 className="text-xl font-bold">{sistemaNombre}</h2>
          <p className="text-sm opacity-90 mt-1">Sistema {sistemaAbrev}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sedapal-lightBlue mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando estadísticas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ACTIVIDADES */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Activity className="text-sedapal-lightBlue mr-2" size={24} />
                <h3 className="text-lg font-bold text-gray-900">Actividades</h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {actividades.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay actividades registradas</p>
                ) : (
                  actividades.map((act) => (
                    <div key={act.id_actividad} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
                      <p className="text-sm font-medium text-gray-900">{act.nombre_actividad}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          T{act.trimestre}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${
                          act.estado_actividad === 'completado' ? 'bg-green-500' :
                          act.estado_actividad === 'reprogramado' ? 'bg-purple-500' :
                          'bg-yellow-500'
                        }`}>
                          {act.estado_actividad === 'completado' ? 'Completado' :
                           act.estado_actividad === 'reprogramado' ? 'Reprogramado' : 'Pendiente'}
                        </span>
                        {act.gerencia_abrev && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                            {act.gerencia_abrev}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Total:</strong> {actividades.length} actividad{actividades.length !== 1 ? 'es' : ''}
                </p>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600">
                    ✔ {actividades.filter(a => a.estado_actividad === 'completado').length} Completadas
                  </span>
                  <span className="text-yellow-600">
                    ⏳ {actividades.filter(a => a.estado_actividad === 'pendiente').length} Pendientes
                  </span>
                  <span className="text-purple-600">
                    🔄 {actividades.filter(a => a.estado_actividad === 'reprogramado').length} Reprogramadas
                  </span>
                </div>
              </div>
            </div>

            {/* USUARIOS */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Users className="text-sedapal-lightBlue mr-2" size={24} />
                <h3 className="text-lg font-bold text-gray-900">Usuarios Asignados</h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {usuarios.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay usuarios asignados</p>
                ) : (
                  usuarios.map((usuario: any) => (
                    <div key={usuario.id_usuario} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
                      <p className="text-sm font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{usuario.email}</p>
                      {(usuario.gerencia_nombre || usuario.equipo_nombre) && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {usuario.gerencia_abrev && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                              {usuario.gerencia_abrev}
                            </span>
                          )}
                          {usuario.equipo_nombre && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                              {usuario.equipo_nombre}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Total:</strong> {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} asignado{usuarios.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* PROGRESO - Gráfico de Barras por Trimestre */}
            <div className="border border-gray-200 rounded-lg p-4 lg:col-span-2">
              <div className="flex items-center mb-4">
                <TrendingUp className="text-sedapal-lightBlue mr-2" size={24} />
                <h3 className="text-lg font-bold text-gray-900">Progreso</h3>
              </div>

              {/* Gráfico de Barras - Actividades por Trimestre */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Actividades por Trimestre</h4>
                <div className="flex items-end justify-between gap-4 h-48">
                  {actividadesPorTrimestre.map((data) => (
                    <div key={data.trimestre} className="flex-1 flex flex-col items-center">
                      <div className="w-full relative" style={{ height: '100%' }}>
                        <div 
                          className="absolute bottom-0 w-full bg-sedapal-lightBlue rounded-t-lg transition-all hover:bg-sedapal-blue"
                          style={{ 
                            height: `${(data.cantidad / maxActividades) * 100}%`,
                            minHeight: data.cantidad > 0 ? '20px' : '0'
                          }}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-900">
                            {data.cantidad}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-2">T{data.trimestre}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estado de Actividades */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Estado de Actividades</h4>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex-1 w-full">
                    {actividadesPorEstado.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center">Sin datos</p>
                    ) : (
                      <div className="space-y-2">
                        {actividadesPorEstado.map((data) => {
                          const total = actividadesPorEstado.reduce((sum, d) => sum + d.cantidad, 0);
                          const porcentaje = total > 0 ? (data.cantidad / total) * 100 : 0;
                          
                          // Mapear estados de actividad correctamente
                          const estadoColor = data.estado === 'completado' ? 'bg-green-500' :
                                             data.estado === 'reprogramado' ? 'bg-purple-500' :
                                             data.estado === 'pendiente' ? 'bg-yellow-500' : 'bg-gray-500';
                          
                          const estadoLabel = data.estado === 'completado' ? 'Completado' :
                                             data.estado === 'reprogramado' ? 'Reprogramado' :
                                             data.estado === 'pendiente' ? 'Pendiente' : data.estado;
                          
                          return (
                            <div key={data.estado} className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                                <div 
                                  className={`h-full ${estadoColor} flex items-center justify-end pr-3 transition-all`}
                                  style={{ width: `${Math.max(porcentaje, 10)}%` }}
                                >
                                  <span className="text-xs font-bold text-white">
                                    {data.cantidad}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <div className={`w-3 h-3 rounded-full ${estadoColor}`}></div>
                                <span className="text-sm font-medium text-gray-700">
                                  {estadoLabel}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600 min-w-[50px] text-right">
                                {porcentaje.toFixed(0)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón Cerrar */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
