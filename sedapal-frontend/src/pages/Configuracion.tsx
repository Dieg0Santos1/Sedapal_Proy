import { useEffect, useState } from 'react';
import {
  sistemasService,
  equiposService,
  gerenciasService,
  tiposEntregablesService,
  adminSistemasService,
  referenciasService
} from '../services/api';
import type { Sistema, Equipo, Gerencia, TipoEntregable, Usuario } from '../services/api';
import Modal from '../components/Modal';
import { Settings, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';

export default function Configuracion() {
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [entregables, setEntregables] = useState<TipoEntregable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Búsquedas por sección
  const [qSistemas, setQSistemas] = useState('');
  const [qEquipos, setQEquipos] = useState('');
  const [qGerencias, setQGerencias] = useState('');
  const [qEntregables, setQEntregables] = useState('');

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [sis, eq, ger, ent] = await Promise.all([
        (sistemasService as any).getAllAdmin ? (sistemasService as any).getAllAdmin() : sistemasService.getAll(),
        equiposService.getAllAdmin ? equiposService.getAllAdmin() : equiposService.getAll(),
        gerenciasService.getAllAdmin ? gerenciasService.getAllAdmin() : gerenciasService.getAll(),
        (tiposEntregablesService as any).getAllAdmin ? (tiposEntregablesService as any).getAllAdmin() : tiposEntregablesService.getAll(),
      ]);
      setSistemas(sis);
      setEquipos(eq);
      setGerencias(ger);
      setEntregables(ent);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const bool = (v: any) => v === true || v === 1;

  // Listas filtradas
  const term = (s: string) => s.trim().toLowerCase();
  const sistemasFiltrados = sistemas.filter(s =>
    term(s.desc_sistema).includes(term(qSistemas)) || (s.abrev ? term(s.abrev).includes(term(qSistemas)) : false)
  );
  const equiposFiltradosVista = equipos.filter(e => {
    const nombre = e.desc_equipo || e.nombre_equipo || '';
    const ger = (e.id_gerencia ?? '').toString();
    const q = term(qEquipos);
    return term(nombre).includes(q) || term(ger).includes(q);
  });
  const gerenciasFiltradas = gerencias.filter(g =>
    term(g.des_gerencia).includes(term(qGerencias)) || (g.abrev ? term(g.abrev).includes(term(qGerencias)) : false)
  );
  const entregablesFiltrados = entregables.filter(t => term(t.nombre_entregables).includes(term(qEntregables)));

  const toggleSistema = async (s: Sistema) => {
    try {
      const activar = !bool(s.estado);
      // Regla: No permitir desactivar si está asignado a un admin
      if (!activar) {
        const admin: Usuario | null = await adminSistemasService.getSistemaAdmin(s.id);
        if (admin) {
          setAlertMsg(`No se puede desactivar el sistema "${s.desc_sistema}" porque está asignado al administrador: ${admin.nombre} ${admin.apellido} (${admin.email}).`);
          setAlertOpen(true);
          return;
        }
      }
      await sistemasService.update(s.id, { estado: activar ? 1 : 0 });
      const refreshed = await sistemasService.getAll();
      setSistemas(refreshed);
    } catch (e: any) {
      setError(e?.message || 'Error al cambiar estado del sistema');
    }
  };

  const toggleEquipo = async (e: Equipo) => {
    try {
      const activar = !bool(e.estado);
      const id = e.id_equipo || e.id || 0;
      if (!activar) {
        const ligado = await referenciasService.equipoTieneActividades(id);
        if (ligado) {
          setAlertMsg(`No se puede desactivar el equipo "${e.desc_equipo || e.nombre_equipo}" porque está vinculado a una o más actividades.`);
          setAlertOpen(true);
          return;
        }
      }
      await equiposService.updateEstado(id, activar ? 1 : 0);
      const refreshed = await (equiposService.getAllAdmin ? equiposService.getAllAdmin() : equiposService.getAll());
      setEquipos(refreshed);
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar estado del equipo');
    }
  };

  const toggleGerencia = async (g: Gerencia) => {
    try {
      const activar = !bool(g.estado);
      if (!activar) {
        const ligado = await referenciasService.gerenciaTieneActividades(g.id_gerencia);
        if (ligado) {
          setAlertMsg(`No se puede desactivar la gerencia "${g.des_gerencia}" porque está vinculada a una o más actividades.`);
          setAlertOpen(true);
          return;
        }
      }
      await gerenciasService.updateEstado(g.id_gerencia, activar);
      const refreshed = await (gerenciasService.getAllAdmin ? gerenciasService.getAllAdmin() : gerenciasService.getAll());
      setGerencias(refreshed);
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar estado de la gerencia');
    }
  };

  const toggleEntregable = async (t: TipoEntregable) => {
    try {
      const activar = !bool(t.estado);
      if (!activar) {
        const ligado = await referenciasService.entregableTieneActividades(t.id_entregable);
        if (ligado) {
          setAlertMsg(`No se puede desactivar el entregable "${t.nombre_entregables}" porque está vinculado a una o más actividades.`);
          setAlertOpen(true);
          return;
        }
      }
      await tiposEntregablesService.updateEstado(t.id_entregable, activar);
      const refreshed = await ((tiposEntregablesService as any).getAllAdmin ? (tiposEntregablesService as any).getAllAdmin() : tiposEntregablesService.getAll());
      setEntregables(refreshed);
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar estado del entregable');
    }
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-sedapal-lightBlue" size={32} />
        <h1 className="text-3xl font-bold text-sedapal-lightBlue">Configuración</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-600">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sistemas */}
          <section className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Sistemas</h2>
              <span className="text-sm text-gray-500">Activar/Desactivar</span>
            </div>
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={qSistemas}
                onChange={(e) => setQSistemas(e.target.value)}
                placeholder="Buscar por nombre o sigla..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue"
              />
            </div>
            <div className="divide-y max-h-80 overflow-y-auto">
              {sistemasFiltrados.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.desc_sistema}</p>
                    <p className="text-xs text-gray-500">{s.abrev || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => toggleSistema(s)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${bool(s.estado)
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                    title={bool(s.estado) ? 'Desactivar' : 'Activar'}
                  >
                    {bool(s.estado) ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {bool(s.estado) ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Equipos */}
          <section className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Equipos</h2>
              <span className="text-sm text-gray-500">Activar/Desactivar</span>
            </div>
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={qEquipos}
                onChange={(e) => setQEquipos(e.target.value)}
                placeholder="Buscar por nombre o id de gerencia..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue"
              />
            </div>
            <div className="divide-y max-h-80 overflow-y-auto">
              {equiposFiltradosVista.map((e) => (
                <div key={e.id_equipo || e.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.desc_equipo || e.nombre_equipo}</p>
                    {e.id_gerencia && (
                      <p className="text-xs text-gray-500">Gerencia: {e.id_gerencia}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleEquipo(e)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${bool(e.estado)
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                    title={bool(e.estado) ? 'Desactivar' : 'Activar'}
                  >
                    {bool(e.estado) ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {bool(e.estado) ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Gerencias */}
          <section className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Gerencias</h2>
              <span className="text-sm text-gray-500">Activar/Desactivar</span>
            </div>
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={qGerencias}
                onChange={(e) => setQGerencias(e.target.value)}
                placeholder="Buscar por nombre o sigla..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue"
              />
            </div>
            <div className="divide-y max-h-80 overflow-y-auto">
              {gerenciasFiltradas.map((g) => (
                <div key={g.id_gerencia} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{g.des_gerencia}</p>
                    <p className="text-xs text-gray-500">{g.abrev || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => toggleGerencia(g)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${bool(g.estado)
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                    title={bool(g.estado) ? 'Desactivar' : 'Activar'}
                  >
                    {bool(g.estado) ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {bool(g.estado) ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Entregables */}
          <section className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Entregables</h2>
              <span className="text-sm text-gray-500">Activar/Desactivar</span>
            </div>
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={qEntregables}
                onChange={(e) => setQEntregables(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue"
              />
            </div>
            <div className="divide-y max-h-80 overflow-y-auto">
              {entregablesFiltrados.map((t) => (
                <div key={t.id_entregable} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.nombre_entregables}</p>
                  </div>
                  <button
                    onClick={() => toggleEntregable(t)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${bool(t.estado)
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                    title={bool(t.estado) ? 'Desactivar' : 'Activar'}
                  >
                    {bool(t.estado) ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {bool(t.estado) ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Alert modal (no nativa) */}
      <Modal isOpen={alertOpen} onClose={() => setAlertOpen(false)} title="No se puede desactivar">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertTriangle className="text-yellow-700" size={20} />
            </div>
          </div>
          <div className="text-sm text-gray-700">
            {alertMsg}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={() => setAlertOpen(false)} className="px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue">Entendido</button>
        </div>
      </Modal>
    </div>
  );
}
