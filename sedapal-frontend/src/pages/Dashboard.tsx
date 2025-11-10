import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, FileText, Activity, Users, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { actividadesService, sistemasService, adminActividadesService, usuarioActividadesService, adminSistemasService } from '../services/api';
import type { ActividadConSistema, Sistema } from '../services/api';
import SedapalLogo from '../components/SedapalLogo';
import MisSistemas from './MisSistemas';
import MisSistemasAdmin from './MisSistemasAdmin';
import MisActividades from './MisActividades';
import MisActividadesAdmin from './MisActividadesAdmin';
import MisActividadesUsuario from './MisActividadesUsuario';
import Reporte from './Reporte';
import Configuracion from './Configuracion';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  // Admin inicia en 'sistemas', SuperAdmin en 'dashboard'
  const [activeView, setActiveView] = useState(user?.rol === 'admin' ? 'sistemas' : 'dashboard');
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSistemaId, setSelectedSistemaId] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // SuperAdmin ve actividades creadas por admins, otros roles ven sus propias actividades
      const [actData, sisData] = await Promise.all([
        user?.rol === 'superadmin'
          ? adminActividadesService.getAllActividadesFromAdmins()
          : user?.rol === 'usuario'
            ? usuarioActividadesService.getActividadesByUsuarioOTeam(user?.id_usuario || 0)
            : adminActividadesService.getActividadesByAdmin(user?.id_usuario || 0),
        user?.rol === 'admin' ? adminSistemasService.getSistemasByAdmin(user?.id_usuario || 0) : sistemasService.getAll()
      ]);
      setActividades(actData);
      setSistemas(sisData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
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

// Calcular datos reales para los gráficos
  const actividadesFiltradasSistema = selectedSistemaId ? actividades.filter(act => act.id_sistema === selectedSistemaId) : actividades;

  const dataBySystem = Object.entries(
    actividadesFiltradasSistema.reduce((acc: Record<string, number>, act: any) => {
      const key = (act.sistema_abrev || 'N/A').trim();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, actividades]) => ({ name, actividades }));

  const dataByQuarter = [1, 2, 3, 4].map(trimestre => {
const count = actividadesFiltradasSistema.filter(act => (Array.isArray((act as any).trimestres) ? (act as any).trimestres.includes(trimestre) : act.trimestre === trimestre)).length;
    return {
      name: `${trimestre}° Trim.`,
      actividades: count
    };
  });

const pendientes = actividadesFiltradasSistema.filter(act => act.estado_actividad === 'pendiente').length;
  const reprogramadas = actividadesFiltradasSistema.filter(act => act.estado_actividad === 'reprogramado').length;
  const completadas = actividadesFiltradasSistema.filter(act => act.estado_actividad === 'completado').length;

  const statusData = [
    { name: 'Pendiente', value: pendientes, color: '#EAB308' },
    { name: 'Reprogramado', value: reprogramadas, color: '#F97316' },
    { name: 'Completado', value: completadas, color: '#10B981' },
  ].filter(item => item.value > 0);

  const totalActividades = actividades.length;
  const porcentajeCompletadas = totalActividades > 0 
    ? Math.round((completadas / totalActividades) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Logo solo visible en móvil */}
            <div className="md:hidden">
              <SedapalLogo size="sm" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-sedapal-blue">Plan de los Sistemas</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="bg-sedapal-lightBlue hover:bg-sedapal-blue text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-48 bg-white border-r border-gray-200 md:min-h-screen">
          {/* Logo en el sidebar */}
          <div className="hidden md:flex items-center justify-center py-6 border-b border-gray-200">
            <SedapalLogo size="md" />
          </div>
          <nav className="py-4 flex md:flex-col overflow-x-auto md:overflow-x-visible">
            {/* Dashboard - Visible para SuperAdmin, Admin y Usuario */}
            {(user?.rol === 'superadmin' || user?.rol === 'usuario' || user?.rol === 'admin') && (
              <button
                onClick={() => setActiveView('dashboard')}
                className={`whitespace-nowrap md:w-full text-left px-6 py-3 text-sm font-medium transition ${
                  activeView === 'dashboard'
                    ? 'bg-sedapal-cyan text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
            )}
            
            {/* Sistemas - SuperAdmin y Admin */}
            {(user?.rol === 'superadmin' || user?.rol === 'admin') && (
              <button
                onClick={() => setActiveView('sistemas')}
                className={`whitespace-nowrap md:w-full text-left px-6 py-3 text-sm font-medium transition ${
                  activeView === 'sistemas'
                    ? 'bg-sedapal-cyan text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mis sistemas
              </button>
            )}
            
            {/* Actividades - Todos pueden ver */}
            <button
              onClick={() => setActiveView('actividades')}
              className={`whitespace-nowrap md:w-full text-left px-6 py-3 text-sm font-medium transition ${
                activeView === 'actividades'
                  ? 'bg-sedapal-cyan text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Mis actividades
            </button>
            
            {/* Reporte - para todos los roles */}
            <button
              onClick={() => setActiveView('reporte')}
              className={`whitespace-nowrap md:w-full text-left px-6 py-3 text-sm font-medium transition ${
                activeView === 'reporte'
                  ? 'bg-sedapal-cyan text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Reporte
            </button>

            {/* Configuración - solo SuperAdmin */}
            {user?.rol === 'superadmin' && (
              <button
                onClick={() => setActiveView('configuracion')}
                className={`whitespace-nowrap md:w-full text-left px-6 py-3 text-sm font-medium transition ${
                  activeView === 'configuracion'
                    ? 'bg-sedapal-cyan text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Configuración
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
{activeView === 'dashboard' && (user?.rol === 'superadmin' || user?.rol === 'usuario' || user?.rol === 'admin') && (
            <div className="p-4 sm:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Cargando datos...</div>
            </div>
          ) : (
            <>
          {user?.rol === 'admin' && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-4 items-end gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-sedapal-blue mb-1">Filtrar por sistema</label>
                <select
                  className="w-full px-3 py-2 border-2 border-sedapal-cyan text-sedapal-blue rounded-lg bg-white focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue hover:border-sedapal-lightBlue/70 transition"
                  value={selectedSistemaId}
                  onChange={(e)=>setSelectedSistemaId(parseInt(e.target.value))}
                >
                  <option value={0}>Todos</option>
                  {sistemas.map(s=>(<option key={s.id} value={s.id}>{s.abrev} - {s.desc_sistema}</option>))}
                </select>
              </div>
              <div className="sm:col-span-2 text-xs text-gray-500">
                Consejo: Selecciona un sistema para ver gráficos y métricas específicas.
              </div>
            </div>
          )}
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Gráfico de Estado */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Estado de Actividades</h3>
              <div className="flex justify-center items-center h-64">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={false}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry: any) => {
                          const percentage = ((entry.payload.value / totalActividades) * 100).toFixed(0);
                          return `${value}: ${entry.payload.value} (${percentage}%)`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm">No hay datos disponibles</p>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pendientes</span>
                  <span className="font-semibold text-yellow-600">{pendientes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reprogramadas</span>
                  <span className="font-semibold text-orange-600">{reprogramadas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completadas</span>
                  <span className="font-semibold text-green-600">{completadas}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="font-bold">{totalActividades}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">% Completadas</span>
                  <span className="font-bold text-green-600">{porcentajeCompletadas}%</span>
                </div>
              </div>
            </div>

            {/* Gráfico de Actividades por Sistemas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Actividades por Sistema</h3>
              {dataBySystem.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataBySystem}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                      labelStyle={{ color: '#333' }}
                    />
                    <Bar dataKey="actividades" fill="#06B6D4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500 text-sm">No hay datos disponibles</p>
                </div>
              )}
            </div>

            {/* Gráfico de Actividades por Trimestre */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Actividades por Trimestre</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataByQuarter}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                    labelStyle={{ color: '#333' }}
                  />
                  <Bar dataKey="actividades" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
          )}

          {/* Descripciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-3">
                <Activity className="text-sedapal-cyan mr-2" size={20} />
                <h4 className="font-semibold text-gray-700">Estado</h4>
              </div>
              <p className="text-sm text-gray-600">
                Un gráfico circular que muestre actividades completadas y actividades programadas
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-3">
                <FileText className="text-sedapal-cyan mr-2" size={20} />
                <h4 className="font-semibold text-gray-700">Sistemas</h4>
              </div>
              <p className="text-sm text-gray-600">
                Un gráfico en barra que muestre las actividades de cada sistema
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-3">
                <Users className="text-sedapal-cyan mr-2" size={20} />
                <h4 className="font-semibold text-gray-700">Trimestre</h4>
              </div>
              <p className="text-sm text-gray-600">
                Un gráfico en barra que muestre la cantidad de actividades por trimestre
              </p>
            </div>
          </div>
            </div>
          )}
          
          {activeView === 'sistemas' && (
            user?.rol === 'superadmin' ? <MisSistemas /> : <MisSistemasAdmin idAdmin={user?.id_usuario || 0} />
          )}
          {activeView === 'actividades' && (
            user?.rol === 'superadmin' ? <MisActividades /> : (user?.rol === 'usuario' ? <MisActividadesUsuario idUsuario={user?.id_usuario || 0} /> : <MisActividadesAdmin idAdmin={user?.id_usuario || 0} />)
          )}
          {activeView === 'reporte' && <Reporte />}
          {activeView === 'configuracion' && user?.rol === 'superadmin' && <Configuracion />}
        </main>
      </div>
    </div>
  );
}
