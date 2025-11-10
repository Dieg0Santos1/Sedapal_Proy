import { ClipboardCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usuarioActividadesService, adminActividadesService, notificacionesService } from '../services/api';
import type { ActividadConSistema } from '../services/api';
import ViewEntregablesModal from '../components/ViewEntregablesModal';
import confetti from 'canvas-confetti';

interface MisActividadesUsuarioProps {
  idUsuario: number;
}

export default function MisActividadesUsuario({ idUsuario }: MisActividadesUsuarioProps) {
  const { user } = useAuth();
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEntregablesModalOpen, setIsEntregablesModalOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadConSistema | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  useEffect(() => {
    loadActividades();
    const t = setInterval(loadActividades, 15000); // refresco periódico
    const onVis = () => { if (document.visibilityState === 'visible') loadActividades(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [idUsuario]);

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
          // conservar id_actividad principal (el primero)
          id_actividad: a.id_actividad
        });
      } else {
        existing.actividad_ids.push(a.id_actividad);
        if (a.entregable_nombre && !existing.entregables_lista.includes(a.entregable_nombre)) {
          existing.entregables_lista.push(a.entregable_nombre);
        }
        // fecha más próxima (o mayor) como referencia visual
        if (a.fecha_sustento && (!existing.fecha_sustento || a.fecha_sustento > existing.fecha_sustento)) {
          existing.fecha_sustento = a.fecha_sustento;
        }
        existing.en_revision = existing.en_revision || a.en_revision;
      }
    });
    return Array.from(map.values());
  };

  const loadActividades = async () => {
    try {
      setLoading(true);
      const data = await usuarioActividadesService.getActividadesByUsuarioOTeam(idUsuario);
      setActividades(groupActividades(data));
      setError('');
    } catch (err: any) {
      setError('Error al cargar actividades: ' + err.message);
    } finally {
      setLoading(false);
    }
  };



  const handleOpenEntregables = (actividad: ActividadConSistema) => {
    setSelectedActividad(actividad);
    setIsEntregablesModalOpen(true);
  };

  const handleMarcarCompletado = async () => {
    if (!selectedActividad) return;

    try {
      // 1) Solo marcar cumplimiento del usuario; no cerrar la actividad.
      await usuarioActividadesService.updateCumplimiento(
        idUsuario,
        selectedActividad.id_actividad,
        'cumple'
      );

      // 2) Notificar al/los admin(s)
      try {
        const admins = await adminActividadesService.getAdminsByActividad(selectedActividad.id_actividad);
        if (admins && admins.length > 0 && user) {
          await notificacionesService.enviarUsuarioCumplio({
            adminEmail: admins[0].email,
            usuarioNombre: `${user.nombre} ${user.apellido}`,
            usuarioEmail: user.email,
            nombreActividad: selectedActividad.nombre_actividad || 'Actividad',
            entregableNombre: selectedActividad.entregable_nombre || 'No especificado',
            sistemaAbrev: selectedActividad.sistema_abrev || 'N/A',
            equipoNombre: selectedActividad.equipo_nombre || 'N/A',
            fechaMaxima: selectedActividad.fecha_sustento || null
          });
        }
      } catch (e) {
        console.warn('No se pudo notificar al admin:', e);
      }

      await loadActividades();
      setIsEntregablesModalOpen(false);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      });
    } catch (err: any) {
      throw new Error(err.message || 'Error al marcar cumplimiento');
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
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
      {/* Título de la página */}
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

      {/* Filtros */}
      <div className="mb-4">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="revision">En revisión</option>
          <option value="reprogramado">Reprogramado</option>
          <option value="completado">Completado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actividad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerencia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo Responsable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trimestre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Máxima</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregables</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actividades.filter(act => {
              if (!filtroEstado) return true;
              if (filtroEstado === 'revision') return (act as any).en_revision && act.estado_actividad !== 'completado';
              return act.estado_actividad === filtroEstado;
            }).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No tienes actividades asignadas
                </td>
              </tr>
            ) : (
              actividades
                .filter((actividad: any) => {
                  if (!filtroEstado) return true;
                  if (filtroEstado === 'revision') return actividad.en_revision && actividad.estado_actividad !== 'completado';
                  return actividad.estado_actividad === filtroEstado;
                })
                .map((actividad: any) => (
                <tr key={actividad.id_actividad} className="hover:bg-gray-50">
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
                    {(() => {
                      const enRevision = actividad.en_revision && actividad.estado_actividad !== 'completado';
                      const base = 'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ';
                      if (actividad.estado_actividad === 'completado') {
                        return <span className={base + 'bg-blue-100 text-blue-800'}>Completado</span>;
                      }
                      if (enRevision) {
                        return <span className={base + 'bg-yellow-100 text-yellow-800'}>En revisión</span>;
                      }
                      if (actividad.estado_actividad === 'reprogramado') {
                        return <span className={base + 'bg-purple-100 text-purple-800'}>Reprogramado</span>;
                      }
                      return <span className={base + 'bg-red-100 text-red-700'}>Pendiente</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenEntregables(actividad)}
                      className="text-white bg-sedapal-lightBlue hover:bg-sedapal-blue px-3 py-2 rounded transition flex items-center gap-1"
                      title="Ver Entregables"
                    >
                      <ClipboardCheck size={16} />
                      <span className="text-xs">Entregables</span>
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
          📋 <strong>Instrucciones:</strong> Carga tus entregables y cuando termines pulsa “Cumplió”.
          La actividad solo pasará a <strong>Completado</strong> cuando el administrador la marque como <strong>Conforme</strong>.
        </p>
      </div>
      </div>

      {/* Modal: Ver Entregables */}
      <ViewEntregablesModal
        isOpen={isEntregablesModalOpen}
        onClose={() => setIsEntregablesModalOpen(false)}
        entregableNombre={selectedActividad?.entregable_nombre}
        entregablesNombres={(selectedActividad as any)?.entregables_lista}
        activityName={selectedActividad?.nombre_actividad}
        activityMaxDate={selectedActividad?.fecha_sustento || null}
        activityCompletionStatus={selectedActividad?.estado_actividad || null}
        userFulfillmentStatus={(selectedActividad as any)?.cumplimiento || null}
        onChangeStatus={handleMarcarCompletado}
        isAdmin={false}
      />
    </div>
  );
}
