import { Target, Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { sistemasService, usuariosService, adminSistemasService, notificacionesService } from '../services/api';
import type { Sistema } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';

export default function MisSistemas() {
  const { user } = useAuth();
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdAdminData, setCreatedAdminData] = useState<{email: string, password: string} | null>(null);
  const [createdUserData, setCreatedUserData] = useState<{email: string, password: string} | null>(null);
  const [isQuickAdminOpen, setIsQuickAdminOpen] = useState(false);
  const [isQuickUserOpen, setIsQuickUserOpen] = useState(false);
  const [editingSistema, setEditingSistema] = useState<Sistema | null>(null);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [sistemaParaUnassign, setSistemaParaUnassign] = useState<Sistema | null>(null);
  const [adminAsignado, setAdminAsignado] = useState<any | null>(null);
  const [deletingSistemaId, setDeletingSistemaId] = useState<number | null>(null);
  const [assigningSistemaId, setAssigningSistemaId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminsExistentes, setAdminsExistentes] = useState<any[]>([]);
  const [modoAsignacion, setModoAsignacion] = useState<'nuevo' | 'existente'>('nuevo');
  const [adminSeleccionadoId, setAdminSeleccionadoId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    desc_sistema: '',
    abrev: '',
    administrador: '',
    suplente: '',
    estado: 1
  });

  // Admin form state
  const [adminFormData, setAdminFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    contrasena: ''
  });

  // Quick create forms
  const [quickAdminForm, setQuickAdminForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    idSistema: 0
  });
  const [quickUserForm, setQuickUserForm] = useState({
    nombre: '',
    apellido: '',
    email: ''
  });

  // Cargar sistemas y admins existentes al montar
  useEffect(() => {
    loadSistemas();
    loadAdminsExistentes();
  }, []);

  // Helper: Normalizar nombres (Primera letra mayúscula)
  const normalizeName = (s: string) => s.trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const loadSistemas = async () => {
    try {
      setLoading(true);
      
      // Si es admin, solo cargar sus sistemas asignados
      // Si es superadmin, cargar todos los sistemas
      let data;
      if (user?.rol === 'admin' && user?.id_usuario) {
        data = await adminSistemasService.getSistemasByAdmin(user.id_usuario);
      } else {
        data = await sistemasService.getAll();
      }
      
      setSistemas(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar sistemas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminsExistentes = async () => {
    try {
      const admins = await usuariosService.getAdmins();
      setAdminsExistentes(admins);
    } catch (err: any) {
      console.error('Error al cargar admins:', err);
    }
  };

  const handleOpenModal = (sistema?: Sistema) => {
    if (sistema) {
      setEditingSistema(sistema);
      setFormData({
        desc_sistema: sistema.desc_sistema,
        abrev: sistema.abrev || '',
        administrador: sistema.administrador || '',
        suplente: sistema.suplente || '',
        estado: sistema.estado
      });
    } else {
      setEditingSistema(null);
      setFormData({
        desc_sistema: '',
        abrev: '',
        administrador: '',
        suplente: '',
        estado: 1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSistema(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingSistema) {
        await sistemasService.update(editingSistema.id, formData);
      } else {
        await sistemasService.create(formData);
      }
      await loadSistemas();
      handleCloseModal();
      
      // Animación de confeti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#0EA5E9', '#3B82F6', '#10B981']
      });
    } catch (err: any) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSistemaId) return;
    
    setIsSubmitting(true);
    try {
      await sistemasService.delete(deletingSistemaId);
      await loadSistemas();
      setIsConfirmOpen(false);
      setDeletingSistemaId(null);
    } catch (err: any) {
      setError('Error al eliminar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirm = (id: number) => {
    setDeletingSistemaId(id);
    setIsConfirmOpen(true);
  };

  const openAssignAdminModal = (sistemaId: number) => {
    setAssigningSistemaId(sistemaId);
    setAdminFormData({ nombre: '', apellido: '', email: '', contrasena: '' });
    setModoAsignacion('nuevo');
    setAdminSeleccionadoId(null);
    setIsAdminModalOpen(true);
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningSistemaId) return;
    
    setIsSubmitting(true);
    setError(''); // Limpiar errores previos
    
    try {
      if (modoAsignacion === 'nuevo') {
        // Crear nuevo administrador (generar contraseña automáticamente y enviar email desde backend)
        const inicialN = adminFormData.nombre.charAt(0).toUpperCase();
        const inicialA = adminFormData.apellido.charAt(0).toUpperCase();
        const dos = Math.floor(Math.random() * 90 + 10);
        const password = `Admin${inicialN}${inicialA}${dos}`;

        await usuariosService.createAdminBackend({
          nombre: adminFormData.nombre,
          apellido: adminFormData.apellido,
          email: adminFormData.email,
          contrasena: password,
          idSistema: assigningSistemaId
        });

        // Notificar asignación de sistema al nuevo admin
        try {
          const sis = sistemas.find(s => s.id === assigningSistemaId);
          await notificacionesService.enviarAsignacionSistema({
            email: adminFormData.email,
            nombreAdmin: `${adminFormData.nombre} ${adminFormData.apellido}`,
            sistemaAbrev: sis?.abrev || 'N/A',
            sistemaNombre: sis?.desc_sistema || 'Sistema'
          });
        } catch (e) { console.warn('No se pudo notificar asignación de sistema:', e); }

        // Guardar datos para mostrar en modal de éxito
        setCreatedAdminData({
          email: adminFormData.email,
          password: password
        });
        
        setIsSuccessModalOpen(true);
      } else {
        // Asignar administrador existente al sistema
        if (!adminSeleccionadoId) {
          setError('Debes seleccionar un administrador');
          setIsSubmitting(false);
          return;
        }

        await adminSistemasService.assign(adminSeleccionadoId, assigningSistemaId);

        // Notificar asignación al admin existente
        try {
          const admin = adminsExistentes.find(a => a.id_usuario === adminSeleccionadoId);
          const sis = sistemas.find(s => s.id === assigningSistemaId);
          if (admin && sis) {
            await notificacionesService.enviarAsignacionSistema({
              email: admin.email,
              nombreAdmin: `${admin.nombre} ${admin.apellido}`,
              sistemaAbrev: sis.abrev || 'N/A',
              sistemaNombre: sis.desc_sistema || 'Sistema'
            });
          }
        } catch (e) { console.warn('No se pudo notificar asignación de sistema:', e); }
        
        // Recargar sistemas para ver el cambio
        await loadSistemas();
      }
      
      setIsAdminModalOpen(false);
      setAssigningSistemaId(null);
      setAdminFormData({ nombre: '', apellido: '', email: '', contrasena: '' });
      setAdminSeleccionadoId(null);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#0EA5E9', '#3B82F6', '#10B981']
      });
    } catch (err: any) {
      console.error('Error completo:', err);
      const errorMessage = err?.message || err?.error_description || err?.msg || JSON.stringify(err);
      setError('Error al asignar administrador: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar sistemas por búsqueda
  const sistemasFiltrados = sistemas.filter(sistema =>
    sistema.desc_sistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sistema.abrev?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (sistema.administrador?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (sistema.suplente?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  // Calcular paginación
  const totalPages = Math.ceil(sistemasFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const sistemasPaginados = sistemasFiltrados.slice(startIndex, endIndex);

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando sistemas...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="text-sedapal-lightBlue mr-3" size={32} />
          <h1 className="text-3xl font-bold text-sedapal-lightBlue">
            {user?.rol === 'admin' ? 'Mis Sistemas Asignados' : 'Mis Sistemas'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {user?.rol === 'superadmin' && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition"
            >
              <Plus size={20} className="mr-2" />
              Añadir Sistema
            </button>
          )}
          {/* Quick create buttons */}
          <button
            onClick={() => setIsQuickAdminOpen(true)}
            className="flex items-center px-4 py-2 border-2 border-sedapal-cyan text-sedapal-blue rounded-lg hover:bg-sedapal-cyan hover:text-white transition"
          >
            Crear Admin
          </button>
          {user?.rol !== 'superadmin' && (
            <button
              onClick={() => setIsQuickUserOpen(true)}
              className="flex items-center px-4 py-2 border-2 border-sedapal-cyan text-sedapal-blue rounded-lg hover:bg-sedapal-cyan hover:text-white transition"
            >
              Crear Usuario
            </button>
          )}
        </div>
      </div>

      {/* Información para Admins */}
      {user?.rol === 'admin' && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📋 <strong>Información:</strong> Estos son los sistemas que te han sido asignados.
          </p>
        </div>
      )}

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
            placeholder="Buscar por nombre, sigla, administrador o suplente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sigla</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrador</th>
              {user?.rol !== 'superadmin' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suplente</th>
              )}
              {user?.rol === 'superadmin' && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sistemasPaginados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
            {searchTerm ? 'No se encontraron resultados' : (user?.rol === 'admin' ? 'No tienes sistemas asignados' : 'No hay sistemas registrados')}
                </td>
              </tr>
            ) : (
              sistemasPaginados.map((sistema, index) => (
                <tr key={sistema.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{sistema.desc_sistema}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-cyan text-white">
                      {sistema.abrev || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{sistema.administrador || '-'}</td>
                  {user?.rol !== 'superadmin' && (
                    <td className="px-6 py-4 text-sm text-gray-900">{sistema.suplente || '-'}</td>
                  )}
                  {user?.rol === 'superadmin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openAssignAdminModal(sistema.id)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                          title="Asignar administrador"
                        >
                          <UserPlus size={18} />
                        </button>
                        <button
                          onClick={async () => {
                            setSistemaParaUnassign(sistema);
                            try {
                              const admin = await adminSistemasService.getSistemaAdmin(sistema.id);
                              setAdminAsignado(admin);
                            } catch { setAdminAsignado(null); }
                            setIsUnassignModalOpen(true);
                          }}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                          title="Quitar asignación"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(sistema.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
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
            Mostrando {startIndex + 1} a {Math.min(endIndex, sistemasFiltrados.length)} de {sistemasFiltrados.length} resultados
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 bg-sedapal-cyan text-white rounded-lg hover:bg-sedapal-lightBlue disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
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
              className="flex items-center px-3 py-2 bg-sedapal-cyan text-white rounded-lg hover:bg-sedapal-lightBlue disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              <span className="hidden sm:inline mr-1">Siguiente</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Quitar asignación de administrador */}
      <Modal
        isOpen={isUnassignModalOpen}
        onClose={() => setIsUnassignModalOpen(false)}
        title="Quitar administrador del sistema"
      >
        <div className="space-y-4">
          {sistemaParaUnassign ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800"><strong>Sistema:</strong> {sistemaParaUnassign.desc_sistema} ({sistemaParaUnassign.abrev || 'N/A'})</p>
              <p className="text-sm text-blue-800"><strong>Administrador actual:</strong> {adminAsignado ? `${adminAsignado.nombre} ${adminAsignado.apellido} (${adminAsignado.email})` : 'No asignado'}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg" onClick={() => setIsUnassignModalOpen(false)}>Cancelar</button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              disabled={isSubmitting || !adminAsignado || !sistemaParaUnassign}
              onClick={async () => {
                if (!adminAsignado || !sistemaParaUnassign) return;
                setIsSubmitting(true);
                try {
                  await adminSistemasService.unassign(adminAsignado.id_usuario, sistemaParaUnassign.id);
                  await loadSistemas();
                  setIsUnassignModalOpen(false);
                } catch (e: any) { setError(e?.message || 'Error al quitar asignación'); }
                finally { setIsSubmitting(false); }
              }}
            >
              Quitar asignación
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSistema ? 'Editar Sistema' : 'Añadir Sistema'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Sistema *
            </label>
            <input
              type="text"
              required
              value={formData.desc_sistema}
              onChange={(e) => setFormData({ ...formData, desc_sistema: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sigla
            </label>
            <input
              type="text"
              value={formData.abrev}
              onChange={(e) => setFormData({ ...formData, abrev: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Administrador
            </label>
            <input
              type="text"
              value={formData.administrador}
              onChange={(e) => setFormData({ ...formData, administrador: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suplente
            </label>
            <input
              type="text"
              value={formData.suplente}
              onChange={(e) => setFormData({ ...formData, suplente: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar Sistema?"
        message="¿Estás seguro de que deseas eliminar este sistema? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isLoading={isSubmitting}
      />

      {/* Modal para Asignar Administrador */}
      <Modal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        title="Asignar Administrador al Sistema"
      >
        <form onSubmit={handleAssignAdmin} className="space-y-4">
          {/* Selector de modo: Nuevo o Existente */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setModoAsignacion('nuevo')}
              className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
                modoAsignacion === 'nuevo'
                  ? 'bg-sedapal-lightBlue text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Crear Nuevo Admin
            </button>
            <button
              type="button"
              onClick={() => setModoAsignacion('existente')}
              className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
                modoAsignacion === 'existente'
                  ? 'bg-sedapal-lightBlue text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Seleccionar Existente
            </button>
          </div>

          {modoAsignacion === 'existente' ? (
            /* Modo: Seleccionar Admin Existente */
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  👤 Selecciona un administrador existente para asignarlo a este sistema.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Administrador *
                </label>
                <select
                  required
                  value={adminSeleccionadoId || ''}
                  onChange={(e) => setAdminSeleccionadoId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
                >
                  <option value="">Selecciona un administrador</option>
                  {adminsExistentes.map((admin) => (
                    <option key={admin.id_usuario} value={admin.id_usuario}>
                      {admin.nombre} {admin.apellido} ({admin.email})
                    </option>
                  ))}
                </select>
                {adminsExistentes.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay administradores creados aún. Crea uno primero.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Modo: Crear Nuevo Admin */
            <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={adminFormData.nombre}
              onChange={(e) => setAdminFormData({ ...adminFormData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              placeholder="Ej: Juan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              required
              value={adminFormData.apellido}
              onChange={(e) => setAdminFormData({ ...adminFormData, apellido: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              placeholder="Ej: Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={adminFormData.email}
              onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              placeholder="admin@sedapal.com"
            />
          </div>

          {/* Contraseña eliminada: se generará automáticamente y se enviará por email */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              🔑 La contraseña se generará automáticamente y se enviará al correo del administrador.
            </p>
          </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (modoAsignacion === 'existente' && !adminSeleccionadoId)}
              className="flex-1 px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition disabled:opacity-50"
            >
              {isSubmitting ? 'Asignando...' : modoAsignacion === 'nuevo' ? 'Crear y Asignar' : 'Asignar Admin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Éxito con Credenciales (Admin) */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setCreatedAdminData(null);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06B6D4', '#0EA5E9', '#3B82F6', '#10B981']
          });
        }}
        title="✅ Administrador Creado Exitosamente"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  El administrador ha sido creado y asignado al sistema correctamente.
                </p>
              </div>
            </div>
          </div>

          {createdAdminData && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🔑 Credenciales de Acceso</h3>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                    <span className="text-sm font-mono text-gray-900">{createdAdminData.email}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(createdAdminData.email)}
                      className="text-sedapal-lightBlue hover:text-sedapal-blue transition"
                      title="Copiar email"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Contraseña
                  </label>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                    <span className="text-sm font-mono text-gray-900">{createdAdminData.password}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(createdAdminData.password)}
                      className="text-sedapal-lightBlue hover:text-sedapal-blue transition"
                      title="Copiar contraseña"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  ℹ️ <strong>Importante:</strong> Comparte estas credenciales con el administrador de forma segura. El administrador puede iniciar sesión inmediatamente con estos datos.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setIsSuccessModalOpen(false);
                setCreatedAdminData(null);
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#06B6D4', '#0EA5E9', '#3B82F6', '#10B981']
                });
              }}
              className="px-6 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Create Admin */}
      <Modal
        isOpen={isQuickAdminOpen}
        onClose={() => setIsQuickAdminOpen(false)}
        title="Crear Admin Rápido"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
              // Generar contraseña: Admin + inicial nombre + inicial apellido + 2 dígitos
              const inicialN = quickAdminForm.nombre.charAt(0).toUpperCase();
              const inicialA = quickAdminForm.apellido.charAt(0).toUpperCase();
              const dos = Math.floor(Math.random() * 90 + 10);
              const password = `Admin${inicialN}${inicialA}${dos}`;

              if (quickAdminForm.idSistema === 0) throw new Error('Selecciona un sistema');

              // Validación: correo único
              const existente = await usuariosService.getByEmail(quickAdminForm.email);
              if (existente) {
                setError('El correo ya fue registrado previamente.');
                setIsSubmitting(false);
                return;
              }

              await usuariosService.createAdminBackend({
                nombre: normalizeName(quickAdminForm.nombre),
                apellido: normalizeName(quickAdminForm.apellido),
                email: quickAdminForm.email.trim(),
                contrasena: password,
                idSistema: quickAdminForm.idSistema
              });

              setCreatedAdminData({ email: quickAdminForm.email, password });
              setIsSuccessModalOpen(true);
              setIsQuickAdminOpen(false);
              setQuickAdminForm({ nombre: '', apellido: '', email: '', idSistema: 0 });
              await loadAdminsExistentes();
            } catch (err: any) {
              setError(err?.message || 'Error al crear admin');
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={quickAdminForm.nombre}
                onChange={(e) => setQuickAdminForm({ ...quickAdminForm, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input
                type="text"
                required
                value={quickAdminForm.apellido}
                onChange={(e) => setQuickAdminForm({ ...quickAdminForm, apellido: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
            <input
              type="email"
              required
              value={quickAdminForm.email}
              onChange={(e) => setQuickAdminForm({ ...quickAdminForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sistema *</label>
            <select
              value={quickAdminForm.idSistema}
              onChange={(e) => setQuickAdminForm({ ...quickAdminForm, idSistema: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            >
              <option value={0}>Selecciona un sistema</option>
              {sistemas.map(s => (
                <option key={s.id} value={s.id}>{s.abrev} - {s.desc_sistema}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsQuickAdminOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition">Crear</button>
          </div>
        </form>
      </Modal>

      {/* Quick Create Usuario */}
      <Modal
        isOpen={isQuickUserOpen}
        onClose={() => setIsQuickUserOpen(false)}
        title="Crear Usuario Rápido"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
              // Validación: correo único
              const existente = await usuariosService.getByEmail(quickUserForm.email);
              if (existente) {
                setError('El correo ya fue registrado previamente.');
                setIsSubmitting(false);
                return;
              }

              const res = await usuariosService.createUsuarioBackend({
                nombre: normalizeName(quickUserForm.nombre),
                apellido: normalizeName(quickUserForm.apellido),
                email: quickUserForm.email.trim()
              });
              // backend devuelve la contraseña generada
              const generated = (res as any)?.contrasena || '';
              setCreatedUserData({ email: quickUserForm.email, password: generated });
              setIsQuickUserOpen(false);
              setQuickUserForm({ nombre: '', apellido: '', email: '' });
              await loadUsuariosExistentes();
            } catch (err: any) {
              setError(err?.message || 'Error al crear usuario');
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={quickUserForm.nombre}
                onChange={(e) => setQuickUserForm({ ...quickUserForm, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input
                type="text"
                required
                value={quickUserForm.apellido}
                onChange={(e) => setQuickUserForm({ ...quickUserForm, apellido: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
            <input
              type="email"
              required
              value={quickUserForm.email}
              onChange={(e) => setQuickUserForm({ ...quickUserForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsQuickUserOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition">Crear</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Éxito (Usuario) */}
      <Modal
        isOpen={!!createdUserData}
        onClose={() => setCreatedUserData(null)}
        title="✅ Usuario Creado Exitosamente"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Se enviaron las credenciales al correo del usuario.
            </p>
          </div>
          <div className="space-y-2 bg-white p-3 rounded border">
            <div>
              <span className="text-xs text-gray-600">Email:</span>
              <p className="font-semibold text-gray-900">{createdUserData?.email}</p>
            </div>
            {createdUserData?.password && (
              <div>
                <span className="text-xs text-gray-600">Contraseña:</span>
                <p className="font-semibold text-gray-900">{createdUserData?.password}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setCreatedUserData(null)} className="px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition">Entendido</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
