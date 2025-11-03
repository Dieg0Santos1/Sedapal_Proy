import { ClipboardList, Plus, Edit2, UserPlus, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  adminActividadesService, 
  adminSistemasService, 
  sistemasService,
  equiposService, 
  actividadesService,
  usuariosService, 
  usuarioActividadesService, 
  cambiosFechaService,
  entregablesService,
  notificacionesService
} from '../services/api';
import type { ActividadConSistema, Sistema, Equipo, Entregable } from '../services/api';
import Modal from '../components/Modal';
import ViewEntregablesModal from '../components/ViewEntregablesModal';
import confetti from 'canvas-confetti';
import { validarFechaEnTrimestre, getMensajeErrorFechaTrimestre, getNombreMesesTrimestre } from '../utils/trimestreUtils';

interface MisActividadesAdminProps {
  idAdmin: number;
}

export default function MisActividadesAdmin({ idAdmin }: MisActividadesAdminProps) {
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
  const [sistemasDelegados, setSistemasDelegados] = useState<Sistema[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditFechaModalOpen, setIsEditFechaModalOpen] = useState(false);
  const [isAsignarUsuarioModalOpen, setIsAsignarUsuarioModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isViewEntregablesModalOpen, setIsViewEntregablesModalOpen] = useState(false);
  const [createdUserData, setCreatedUserData] = useState<{email: string, password: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntregables, setSelectedEntregables] = useState<Entregable[]>([]);
  const [selectedActividadForEntregables, setSelectedActividadForEntregables] = useState<ActividadConSistema | null>(null);
  
  // Estados para edición
  const [editingActividadId, setEditingActividadId] = useState<number | null>(null);
  const [assigningActividadId, setAssigningActividadId] = useState<number | null>(null);
  const [cantidadCambios, setCantidadCambios] = useState<number>(0);
  const [usuariosExistentes, setUsuariosExistentes] = useState<any[]>([]);
  const [modoAsignacionUsuario, setModoAsignacionUsuario] = useState<'nuevo' | 'existente'>('nuevo');
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nombre_actividad: '',
    id_sistema: 0,
    id_equipo: 0,
    trimestre: 1,
    fecha_sustento: ''
  });

  const [editFechaData, setEditFechaData] = useState({
    fecha_sustento: '',
    trimestre: 1
  });

  const [usuarioFormData, setUsuarioFormData] = useState({
    nombre: '',
    apellido: '',
    email: ''
  });

  useEffect(() => {
    loadData();
    loadUsuariosExistentes();
  }, [idAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actData, sisData, eqData] = await Promise.all([
        adminActividadesService.getActividadesByAdmin(idAdmin),
        adminSistemasService.getSistemasByAdmin(idAdmin),
        equiposService.getAll()
      ]);
      setActividades(actData);
      setSistemasDelegados(sisData);
      setEquipos(eqData);
      setError('');
    } catch (err: any) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsuariosExistentes = async () => {
    try {
      const usuarios = await usuariosService.getUsuarios();
      setUsuariosExistentes(usuarios);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      nombre_actividad: '',
      id_sistema: sistemasDelegados[0]?.id || 0,
      id_equipo: equipos[0]?.id_equipo || 0,
      trimestre: 1,
      fecha_sustento: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validar que la fecha esté en el trimestre
      if (formData.fecha_sustento && !validarFechaEnTrimestre(formData.fecha_sustento, formData.trimestre)) {
        setError(getMensajeErrorFechaTrimestre(formData.trimestre));
        setIsSubmitting(false);
        return;
      }

      // Obtener el id_gerencia del equipo seleccionado
      const equipoSeleccionado = equipos.find(eq => eq.id_equipo === formData.id_equipo);
      const id_gerencia = equipoSeleccionado?.id_gerencia || 1;

      // Crear la actividad
      const nuevaActividad = await actividadesService.create({
        nombre_actividad: formData.nombre_actividad,
        id_sistema: formData.id_sistema,
        id_equipo: formData.id_equipo,
        id_gerencia: id_gerencia,
        trimestre: formData.trimestre,
        estado_actividad: 'pendiente',
        fecha_sustento: formData.fecha_sustento || undefined,
        evaluacion: 'pendiente'
      });

      // Registrar que el admin creó esta actividad
      await adminActividadesService.registerActividad(idAdmin, nuevaActividad.id_actividad);

      await loadData();
      handleCloseModal();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#0EA5E9', '#3B82F6', '#10B981']
      });
    } catch (err: any) {
      setError('Error al crear actividad: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditFecha = async (actividad: ActividadConSistema) => {
    try {
      // Verificar cuántos cambios de fecha ya se hicieron
      const cambios = await cambiosFechaService.getCantidadCambios(actividad.id_actividad);
      setCantidadCambios(cambios);
      
      if (cambios >= 2) {
        setError('Esta actividad ya ha alcanzado el máximo de 2 cambios de fecha permitidos.');
        return;
      }

      setEditingActividadId(actividad.id_actividad);
      setEditFechaData({
        fecha_sustento: actividad.fecha_sustento || '',
        trimestre: actividad.trimestre || 1
      });
      setIsEditFechaModalOpen(true);
    } catch (err: any) {
      setError('Error al verificar cambios: ' + err.message);
    }
  };

  const handleEditFecha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActividadId) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Si ya hay 2 cambios, no permitir
      if (cantidadCambios >= 2) {
        setError('Ya se alcanzó el máximo de 2 cambios de fecha.');
        setIsSubmitting(false);
        return;
      }

      // Advertencia si la fecha no está en el trimestre (pero se permite cambiar)
      if (editFechaData.fecha_sustento && !validarFechaEnTrimestre(editFechaData.fecha_sustento, editFechaData.trimestre)) {
        console.warn(`Advertencia: Fecha fuera del trimestre ${editFechaData.trimestre}, pero es uno de los ${2 - cantidadCambios} cambios permitidos restantes.`);
      }

      const actividadActual = actividades.find(a => a.id_actividad === editingActividadId);
      const fechaAnterior = actividadActual?.fecha_sustento || null;

      // Actualizar actividad
      await actividadesService.update(editingActividadId, {
        fecha_sustento: editFechaData.fecha_sustento || null,
        estado_actividad: 'reprogramado'
      });

      // Registrar el cambio
      await cambiosFechaService.registrarCambio(
        editingActividadId,
        idAdmin,
        fechaAnterior,
        editFechaData.fecha_sustento
      );

      await loadData();
      setIsEditFechaModalOpen(false);
      setEditingActividadId(null);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFA500', '#FFD700', '#FFEC8B']
      });
    } catch (err: any) {
      setError('Error al editar fecha: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAsignarUsuario = (actividadId: number) => {
    setAssigningActividadId(actividadId);
    setUsuarioFormData({ nombre: '', apellido: '', email: '' });
    setModoAsignacionUsuario('nuevo');
    setUsuarioSeleccionadoId(null);
    setIsAsignarUsuarioModalOpen(true);
  };

  const handleOpenViewEntregables = async (actividad: ActividadConSistema) => {
    try {
      setSelectedActividadForEntregables(actividad);
      const entregables = await entregablesService.getByActividad(actividad.id_actividad);
      setSelectedEntregables(entregables);
      setIsViewEntregablesModalOpen(true);
    } catch (err: any) {
      setError('Error al cargar entregables: ' + err.message);
    }
  };

  const handleDownloadEntregable = async (rutaArchivo: string, nombreArchivo: string) => {
    try {
      const blob = await entregablesService.download(rutaArchivo);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      throw new Error('Error al descargar archivo: ' + err.message);
    }
  };

  const handleChangeActivityStatus = async (status: 'conforme' | 'rechazado') => {
    if (!selectedActividadForEntregables) return;

    try {
      await actividadesService.update(selectedActividadForEntregables.id_actividad, {
        evaluacion: status === 'conforme' ? 'conforme' : 'no conforme',
        estado_actividad: 'completado'
      });

      await loadData();
      setIsViewEntregablesModalOpen(false);
    } catch (err: any) {
      throw new Error('Error al actualizar estado: ' + err.message);
    }
  };

  const handleAsignarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningActividadId) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (modoAsignacionUsuario === 'nuevo') {
        // Crear nuevo usuario
        const inicialNombre = usuarioFormData.nombre.charAt(0).toUpperCase();
        const inicialApellido = usuarioFormData.apellido.charAt(0).toUpperCase();
        const dosDigitos = Math.floor(Math.random() * 90 + 10);
        const contrasenaGenerada = `User${inicialNombre}${inicialApellido}${dosDigitos}`;

        const nuevoUsuario = await usuariosService.createUser({
          nombre: usuarioFormData.nombre,
          apellido: usuarioFormData.apellido,
          email: usuarioFormData.email,
          contrasena: contrasenaGenerada,
          idActividad: assigningActividadId
        });

        // Asignar actividad al usuario
        await usuarioActividadesService.assign(nuevoUsuario.id_usuario, assigningActividadId);

        // Guardar credenciales para mostrar
        setCreatedUserData({
          email: usuarioFormData.email,
          password: contrasenaGenerada
        });

        setIsSuccessModalOpen(true);
        
        // Recargar lista de usuarios
        await loadUsuariosExistentes();
        
        // NOTA: El email con credenciales se envía automáticamente desde el backend
      } else {
        // Asignar usuario existente a la actividad
        if (!usuarioSeleccionadoId) {
          setError('Debes seleccionar un usuario');
          setIsSubmitting(false);
          return;
        }

        await usuarioActividadesService.assign(usuarioSeleccionadoId, assigningActividadId);
        
        // Obtener datos del usuario y la actividad para enviar notificación
        const usuario = usuariosExistentes.find(u => u.id_usuario === usuarioSeleccionadoId);
        const actividad = actividades.find(a => a.id_actividad === assigningActividadId);
        
        if (usuario && actividad) {
          // Enviar notificación por email
          await notificacionesService.enviarNotificacionActividad(
            usuario.email,
            `${usuario.nombre} ${usuario.apellido}`,
            actividad.nombre_actividad || 'Sin nombre',
            actividad.sistema_abrev || 'N/A',
            actividad.equipo_nombre || 'N/A',
            actividad.trimestre || 1,
            actividad.fecha_sustento
          );
        }
      }

      setIsAsignarUsuarioModalOpen(false);
      setAssigningActividadId(null);
      setUsuarioFormData({ nombre: '', apellido: '', email: '' });
      setUsuarioSeleccionadoId(null);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      });
    } catch (err: any) {
      setError('Error al asignar usuario: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar actividades
  const actividadesFiltradas = actividades.filter(act =>
    (act.nombre_actividad?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (act.sistema_abrev?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (act.equipo_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  // Paginación
  const totalPages = Math.ceil(actividadesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const actividadesPaginadas = actividadesFiltradas.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ClipboardList className="text-sedapal-lightBlue mr-3" size={32} />
          <h1 className="text-3xl font-bold text-sedapal-lightBlue">Mis Actividades</h1>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition"
          disabled={sistemasDelegados.length === 0}
        >
          <Plus size={20} className="mr-2" />
          Añadir Actividad
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Información */}
      {sistemasDelegados.length === 0 ? (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Sin sistemas delegados:</strong> No tienes sistemas asignados. 
            Contacta al SuperAdministrador para que te asigne sistemas.
          </p>
        </div>
      ) : (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📋 <strong>Información:</strong> Puedes crear actividades en tus sistemas delegados. 
            Tienes <strong>máximo 2 cambios</strong> de fecha por actividad.
          </p>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, sistema o equipo..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trimestre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Máxima</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregables</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actividadesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron resultados' : 'No has creado actividades aún'}
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
                  <td className="px-6 py-4 text-sm text-gray-700">{actividad.equipo_nombre || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-lightBlue text-white">
                      {actividad.trimestre ? `T${actividad.trimestre}` : 'N/A'}
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
                      onClick={() => handleOpenViewEntregables(actividad)}
                      className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                      title="Ver Entregables"
                    >
                      <ClipboardList size={18} />
                      <span className="text-xs">Ver Entregables</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditFecha(actividad)}
                        className="text-orange-600 hover:text-orange-800 transition flex items-center gap-1"
                        title="Editar Fecha"
                      >
                        <Calendar size={18} />
                        <span className="text-xs">Fecha</span>
                      </button>
                      <button
                        onClick={() => handleOpenAsignarUsuario(actividad.id_actividad)}
                        className="text-green-600 hover:text-green-800 transition flex items-center gap-1"
                        title="Asignar Usuario"
                      >
                        <UserPlus size={18} />
                        <span className="text-xs">Usuario</span>
                      </button>
                    </div>
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

      {/* Modal: Añadir Actividad */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Añadir Nueva Actividad"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Actividad *
            </label>
            <input
              type="text"
              required
              value={formData.nombre_actividad}
              onChange={(e) => setFormData({ ...formData, nombre_actividad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              placeholder="Ej: Auditoría interna del sistema"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sistema *
            </label>
            <select
              required
              value={formData.id_sistema}
              onChange={(e) => setFormData({ ...formData, id_sistema: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            >
              <option value={0}>Selecciona un sistema</option>
              {sistemasDelegados.map(sistema => (
                <option key={sistema.id} value={sistema.id}>
                  {sistema.abrev} - {sistema.desc_sistema}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipo Responsable *
            </label>
            <select
              required
              value={formData.id_equipo}
              onChange={(e) => setFormData({ ...formData, id_equipo: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            >
              <option value={0}>Selecciona un equipo</option>
              {equipos.map(equipo => (
                <option key={equipo.id_equipo} value={equipo.id_equipo}>
                  {equipo.desc_equipo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trimestre *
              </label>
              <select
                required
                value={formData.trimestre}
                onChange={(e) => setFormData({ ...formData, trimestre: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              >
                <option value={1}>Trimestre 1 ({getNombreMesesTrimestre(1)})</option>
                <option value={2}>Trimestre 2 ({getNombreMesesTrimestre(2)})</option>
                <option value={3}>Trimestre 3 ({getNombreMesesTrimestre(3)})</option>
                <option value={4}>Trimestre 4 ({getNombreMesesTrimestre(4)})</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Máxima de Entrega
              </label>
              <input
                type="date"
                value={formData.fecha_sustento}
                onChange={(e) => setFormData({ ...formData, fecha_sustento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Actividad'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Fecha */}
      <Modal
        isOpen={isEditFechaModalOpen}
        onClose={() => setIsEditFechaModalOpen(false)}
        title="Editar Fecha de Actividad"
      >
        <form onSubmit={handleEditFecha} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Cambios restantes:</strong> {2 - cantidadCambios} de 2
            </p>
            {cantidadCambios >= 1 && (
              <p className="text-xs text-yellow-700 mt-1">
                En estos cambios permitidos, puedes cambiar la fecha sin restricción de trimestre.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Fecha Máxima *
            </label>
            <input
              type="date"
              required
              value={editFechaData.fecha_sustento}
              onChange={(e) => setEditFechaData({ ...editFechaData, fecha_sustento: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditFechaModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || cantidadCambios >= 2}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambio'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Asignar Usuario */}
      <Modal
        isOpen={isAsignarUsuarioModalOpen}
        onClose={() => setIsAsignarUsuarioModalOpen(false)}
        title="Asignar Usuario a Actividad"
      >
        <form onSubmit={handleAsignarUsuario} className="space-y-4">
          {/* Selector de modo: Nuevo o Existente */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setModoAsignacionUsuario('nuevo')}
              className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
                modoAsignacionUsuario === 'nuevo'
                  ? 'bg-green-500 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Crear Nuevo Usuario
            </button>
            <button
              type="button"
              onClick={() => setModoAsignacionUsuario('existente')}
              className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
                modoAsignacionUsuario === 'existente'
                  ? 'bg-green-500 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Seleccionar Existente
            </button>
          </div>

          {modoAsignacionUsuario === 'existente' ? (
            /* Modo: Seleccionar Usuario Existente */
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  👤 Selecciona un usuario existente para asignarle esta actividad.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario *
                </label>
                <select
                  required
                  value={usuarioSeleccionadoId || ''}
                  onChange={(e) => setUsuarioSeleccionadoId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
                >
                  <option value="">Selecciona un usuario</option>
                  {usuariosExistentes.map((usuario) => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {usuario.nombre} {usuario.apellido} ({usuario.email})
                    </option>
                  ))}
                </select>
                {usuariosExistentes.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay usuarios creados aún. Crea uno primero.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Modo: Crear Nuevo Usuario */
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📧 Se generará una contraseña automáticamente y se enviará al correo del usuario.
                </p>
              </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={usuarioFormData.nombre}
              onChange={(e) => setUsuarioFormData({ ...usuarioFormData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              placeholder="Juan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              required
              value={usuarioFormData.apellido}
              onChange={(e) => setUsuarioFormData({ ...usuarioFormData, apellido: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              placeholder="Pérez"
            />
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={usuarioFormData.email}
                  onChange={(e) => setUsuarioFormData({ ...usuarioFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
                  placeholder="juan.perez@sedapal.com.pe"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAsignarUsuarioModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (modoAsignacionUsuario === 'existente' && !usuarioSeleccionadoId)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Asignando...' : modoAsignacionUsuario === 'nuevo' ? 'Crear y Asignar' : 'Asignar Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ver Entregables */}
      <ViewEntregablesModal
        isOpen={isViewEntregablesModalOpen}
        onClose={() => setIsViewEntregablesModalOpen(false)}
        entregables={selectedEntregables}
        activityName={selectedActividadForEntregables?.nombre_actividad}
        activityStatus={selectedActividadForEntregables?.evaluacion || undefined}
        onDownload={handleDownloadEntregable}
        onChangeStatus={handleChangeActivityStatus}
        isAdmin={true}
      />

      {/* Modal: Credenciales Creadas */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="✅ Usuario Creado Exitosamente"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 mb-3">
              El usuario ha sido creado y asignado a la actividad. Aquí están sus credenciales:
            </p>
            <div className="space-y-2 bg-white p-3 rounded border border-green-300">
              <div>
                <span className="text-xs text-gray-600">Email:</span>
                <p className="font-semibold text-gray-900">{createdUserData?.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-600">Contraseña:</span>
                <p className="font-semibold text-gray-900">{createdUserData?.password}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            ⚠️ Asegúrate de enviar estas credenciales al usuario. También se ha enviado un correo automáticamente.
          </p>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
