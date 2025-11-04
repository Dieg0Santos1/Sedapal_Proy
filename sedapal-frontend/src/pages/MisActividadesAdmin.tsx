import { ClipboardList, Plus, Edit2, UserPlus, Search, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  adminActividadesService, 
  adminSistemasService, 
  sistemasService,
  equiposService,
  gerenciasService,
  tiposEntregablesService,
  actividadesService,
  usuariosService, 
  usuarioActividadesService, 
  cambiosFechaService,
  entregablesService,
  notificacionesService
} from '../services/api';
import type { ActividadConSistema, Sistema, Equipo, Gerencia, Entregable, TipoEntregable } from '../services/api';
import Modal from '../components/Modal';
import ViewEntregablesModal from '../components/ViewEntregablesModal';
import confetti from 'canvas-confetti';
import { validarFechaEnTrimestre, getMensajeErrorFechaTrimestre, getNombreMesesTrimestre } from '../utils/trimestreUtils';
import { calcularFechaMaxima, formatearFechaISO } from '../utils/fechaUtils';

interface MisActividadesAdminProps {
  idAdmin: number;
}

export default function MisActividadesAdmin({ idAdmin }: MisActividadesAdminProps) {
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
  const [sistemasDelegados, setSistemasDelegados] = useState<Sistema[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [tiposEntregables, setTiposEntregables] = useState<TipoEntregable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Búsqueda, filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSistema, setFiltroSistema] = useState<number>(0);
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
  
  // Form states - Nuevo formato con gerencias y equipos múltiples
  const [formData, setFormData] = useState({
    nombre_actividad: '',
    id_sistema: 0,
    id_entregable: 0,
    gerencias_equipos: [] as Array<{ id_gerencia: number; id_equipo: number; gerencia_nombre: string; equipo_nombre: string; gerencia_abrev: string }>,
    trimestres: [] as number[]
  });
  
  // Estados temporales para seleccionar gerencia y equipo
  const [selectedGerenciaId, setSelectedGerenciaId] = useState<number>(0);
  const [selectedEquipoId, setSelectedEquipoId] = useState<number>(0);
  const [equiposFiltrados, setEquiposFiltrados] = useState<Equipo[]>([]);

  const [editFechaData, setEditFechaData] = useState({
    fecha_sustento: '',
    trimestre: 1,
    dias_habiles: 0
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
      const [actData, sisData, eqData, gerData, tiposEntData] = await Promise.all([
        adminActividadesService.getActividadesByAdmin(idAdmin),
        adminSistemasService.getSistemasByAdmin(idAdmin),
        equiposService.getAll(),
        gerenciasService.getAll(),
        tiposEntregablesService.getAll()
      ]);
      console.log('Gerencias cargadas:', gerData);
      console.log('Equipos cargados:', eqData);
      console.log('Tipos de entregables cargados:', tiposEntData);
      setActividades(actData);
      setSistemasDelegados(sisData);
      setEquipos(eqData);
      setGerencias(gerData);
      setTiposEntregables(tiposEntData);
      setError('');
    } catch (err: any) {
      console.error('Error completo al cargar datos:', err);
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
    console.log('Abriendo modal.');
    console.log('Gerencias disponibles:', gerencias);
    console.log('Tipos de entregables disponibles:', tiposEntregables);
    if (tiposEntregables.length > 0) {
      console.log('Primer entregable:', tiposEntregables[0]);
      console.log('nombre_entregables del primero:', JSON.stringify(tiposEntregables[0].nombre_entregables));
      tiposEntregables.forEach((t, i) => {
        console.log(`Entregable ${i+1}: id=${t.id_entregable}, nombre="${t.nombre_entregables}", length=${t.nombre_entregables?.length}`);
      });
    }
    
    setFormData({
      nombre_actividad: '',
      id_sistema: sistemasDelegados[0]?.id || 0,
      id_entregable: 0, // Dejar en 0 para que el usuario seleccione
      gerencias_equipos: [],
      trimestres: []
    });
    // No pre-seleccionar gerencia, dejar en 0 para que el usuario elija
    setSelectedGerenciaId(0);
    setSelectedEquipoId(0);
    setEquiposFiltrados([]);
    setIsModalOpen(true);
  };

  // Cuando cambia la gerencia seleccionada, filtrar los equipos
  useEffect(() => {
    if (selectedGerenciaId > 0) {
      const filtered = equipos.filter(eq => eq.id_gerencia === selectedGerenciaId);
      setEquiposFiltrados(filtered);
      setSelectedEquipoId(filtered[0]?.id_equipo || 0);
    } else {
      setEquiposFiltrados([]);
      setSelectedEquipoId(0);
    }
  }, [selectedGerenciaId, equipos]);

  // Agregar gerencia-equipo a la lista
  const handleAgregarGerenciaEquipo = () => {
    if (selectedGerenciaId === 0 || selectedEquipoId === 0) {
      setError('Debes seleccionar una gerencia y un equipo');
      return;
    }

    // Verificar que no se repita la combinación
    const existe = formData.gerencias_equipos.some(
      ge => ge.id_gerencia === selectedGerenciaId && ge.id_equipo === selectedEquipoId
    );

    if (existe) {
      setError('Esta combinación de gerencia y equipo ya está agregada');
      return;
    }

    const gerencia = gerencias.find(g => g.id_gerencia === selectedGerenciaId);
    const equipo = equiposFiltrados.find(e => e.id_equipo === selectedEquipoId);

    if (!gerencia || !equipo) return;

    setFormData({
      ...formData,
      gerencias_equipos: [
        ...formData.gerencias_equipos,
        {
          id_gerencia: selectedGerenciaId,
          id_equipo: selectedEquipoId,
          gerencia_nombre: gerencia.des_gerencia,
          equipo_nombre: equipo.desc_equipo,
          gerencia_abrev: gerencia.abrev || 'N/A'
        }
      ]
    });
    setError('');
  };

  // Eliminar gerencia-equipo de la lista
  const handleEliminarGerenciaEquipo = (index: number) => {
    setFormData({
      ...formData,
      gerencias_equipos: formData.gerencias_equipos.filter((_, i) => i !== index)
    });
  };

  // Toggle trimestre en la selección múltiple
  const handleToggleTrimestre = (trimestre: number) => {
    if (formData.trimestres.includes(trimestre)) {
      setFormData({
        ...formData,
        trimestres: formData.trimestres.filter(t => t !== trimestre)
      });
    } else {
      setFormData({
        ...formData,
        trimestres: [...formData.trimestres, trimestre].sort()
      });
    }
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
      // Validaciones
      if (formData.gerencias_equipos.length === 0) {
        setError('Debes agregar al menos una gerencia con su equipo');
        setIsSubmitting(false);
        return;
      }

      if (formData.trimestres.length === 0) {
        setError('Debes seleccionar al menos un trimestre');
        setIsSubmitting(false);
        return;
      }

      if (formData.id_entregable === 0) {
        setError('Debes seleccionar un tipo de entregable');
        setIsSubmitting(false);
        return;
      }

      // Calcular fecha máxima usando el Último trimestre seleccionado
      const ultimoTrimestre = Math.max(...formData.trimestres);
      const fechaMaxima = calcularFechaMaxima([ultimoTrimestre], 0);
      const fechaMaximaStr = formatearFechaISO(fechaMaxima);

      // Para cada combinación de gerencia-equipo, crear una actividad
      // NOTA: Podrías crear una sola actividad y múltiples relaciones en tb_as_sis_act
      // pero para simplificar, creamos actividades separadas
      for (const ge of formData.gerencias_equipos) {
        // Crear la actividad con el último trimestre para referencia y todos los trimestres seleccionados
        const nuevaActividad = await actividadesService.create({
          nombre_actividad: formData.nombre_actividad,
          id_sistema: formData.id_sistema,
          id_equipo: ge.id_equipo,
          id_gerencia: ge.id_gerencia,
          id_entregable: formData.id_entregable,
          trimestre: ultimoTrimestre, // Usamos el último trimestre como referencia
          trimestres: formData.trimestres, // Guardar todos los trimestres seleccionados
          estado_actividad: 'pendiente',
          fecha_sustento: fechaMaximaStr,
          evaluacion: 'pendiente'
        });

        // Registrar que el admin creó esta actividad
        await adminActividadesService.registerActividad(idAdmin, nuevaActividad.id_actividad);
      }

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
        trimestre: actividad.trimestre || 1,
        dias_habiles: 0
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

      // Calcular fecha final con días hábiles
      let fechaFinal = editFechaData.fecha_sustento;
      if (editFechaData.dias_habiles > 0 && editFechaData.fecha_sustento) {
        const fecha = new Date(editFechaData.fecha_sustento + 'T00:00:00');
        const fechaConDiasHabiles = calcularFechaMaxima([1], editFechaData.dias_habiles); // Usamos trimestre 1 como dummy
        // Agregar días hábiles a la fecha ingresada
        let diasAgregados = 0;
        while (diasAgregados < editFechaData.dias_habiles) {
          fecha.setDate(fecha.getDate() + 1);
          const diaSemana = fecha.getDay();
          if (diaSemana !== 0 && diaSemana !== 6) {
            diasAgregados++;
          }
        }
        fechaFinal = formatearFechaISO(fecha);
      }

      // Actualizar actividad
      await actividadesService.update(editingActividadId, {
        fecha_sustento: fechaFinal || null,
        estado_actividad: 'reprogramado'
      });

      // Registrar el cambio
      await cambiosFechaService.registrarCambio(
        editingActividadId,
        idAdmin,
        fechaAnterior,
        fechaFinal || editFechaData.fecha_sustento
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
      setIsViewEntregablesModalOpen(true);
    } catch (err: any) {
      setError('Error al cargar entregables: ' + err.message);
    }
  };

  const handleChangeActivityStatus = async (status: 'conforme') => {
    if (!selectedActividadForEntregables) return;

    try {
      await actividadesService.update(selectedActividadForEntregables.id_actividad, {
        evaluacion: 'conforme',
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
  const actividadesFiltradas = actividades.filter(act => {
    const matchesSearch = 
      (act.nombre_actividad?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (act.sistema_abrev?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (act.equipo_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesSistema = filtroSistema === 0 || act.id_sistema === filtroSistema;
    
    return matchesSearch && matchesSistema;
  });

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

      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, sistema o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
          />
        </div>
        
        {/* Filtro por sistema */}
        <div>
          <select
            value={filtroSistema}
            onChange={(e) => setFiltroSistema(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
          >
            <option value={0}>Todos los sistemas</option>
            {sistemasDelegados.map(sistema => (
              <option key={sistema.id} value={sistema.id}>
                {sistema.abrev} - {sistema.desc_sistema}
              </option>
            ))}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trimestres</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregables</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actividadesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm || filtroSistema !== 0 ? 'No se encontraron resultados' : 'No has creado actividades aún'}
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-gray-100 text-gray-700">
                      {actividad.gerencia_abrev || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{actividad.equipo_nombre || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {actividad.trimestres && actividad.trimestres.length > 0 ? (
                        actividad.trimestres.map((trim: number) => (
                          <span key={trim} className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-lightBlue text-white">
                            T{trim}
                          </span>
                        ))
                      ) : actividad.trimestre ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-lightBlue text-white">
                          T{actividad.trimestre}
                        </span>
                      ) : 'N/A'}
                    </div>
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
          {/* Nombre de la actividad */}
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

          {/* Sistema */}
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

          {/* Tipo de Entregable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Entregable * ({tiposEntregables.length} disponibles)
            </label>
            <select
              required
              value={formData.id_entregable}
              onChange={(e) => {
                console.log('Entregable seleccionado:', e.target.value);
                setFormData({ ...formData, id_entregable: parseInt(e.target.value) });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
              size={1}
              style={{ maxHeight: '200px' }}
            >
              <option value={0}>Selecciona un tipo de entregable</option>
              {tiposEntregables.length > 0 ? (
                tiposEntregables.map(tipo => {
                  const nombreLimpio = tipo.nombre_entregables?.trim();
                  return (
                    <option key={tipo.id_entregable} value={tipo.id_entregable}>
                      {nombreLimpio && nombreLimpio.length > 0 ? nombreLimpio : `Entregable #${tipo.id_entregable}`}
                    </option>
                  );
                })
              ) : (
                <option disabled>No hay entregables disponibles</option>
              )}
            </select>
            {tiposEntregables.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No se pudieron cargar los tipos de entregables
              </p>
            )}
          </div>

          {/* Gerencia y Equipo */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Gerencias y Equipos Responsables</h3>
            
            {/* Debug info */}
            <div className="text-xs text-gray-500 mb-2">
              Gerencias cargadas: {gerencias.length}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Gerencia ({gerencias.length} disponibles)
                </label>
                <select
                  value={selectedGerenciaId}
                  onChange={(e) => {
                    console.log('Gerencia seleccionada:', e.target.value);
                    setSelectedGerenciaId(parseInt(e.target.value));
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
                >
                  <option value={0}>Selecciona una gerencia</option>
                  {gerencias.length > 0 ? (
                    gerencias.map(gerencia => (
                      <option key={gerencia.id_gerencia} value={gerencia.id_gerencia}>
                        {gerencia.des_gerencia}
                      </option>
                    ))
                  ) : (
                    <option disabled>No hay gerencias disponibles</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Equipo
                </label>
                <select
                  value={selectedEquipoId}
                  onChange={(e) => setSelectedEquipoId(parseInt(e.target.value))}
                  disabled={equiposFiltrados.length === 0}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent disabled:bg-gray-100"
                >
                  <option value={0}>Selecciona un equipo</option>
                  {equiposFiltrados.map(equipo => (
                    <option key={equipo.id_equipo} value={equipo.id_equipo}>
                      {equipo.desc_equipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAgregarGerenciaEquipo}
              className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition"
            >
              + Agregar Gerencia y Equipo
            </button>

            {/* Lista de gerencias-equipos agregados */}
            {formData.gerencias_equipos.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-600">Agregados:</p>
                {formData.gerencias_equipos.map((ge, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <div className="text-xs">
                      <span className="font-semibold text-sedapal-blue">{ge.gerencia_nombre}</span>
                      <span className="text-gray-500"> → </span>
                      <span className="text-gray-700">{ge.equipo_nombre}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarGerenciaEquipo(index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trimestres (selección múltiple tipo listbox) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trimestres * (Selecciona uno o varios)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((trim) => (
                <button
                  key={trim}
                  type="button"
                  onClick={() => handleToggleTrimestre(trim)}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    formData.trimestres.includes(trim)
                      ? 'bg-sedapal-lightBlue text-white border-sedapal-lightBlue'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-sedapal-lightBlue'
                  }`}
                >
                  Trimestre {trim}
                </button>
              ))}
            </div>
            {formData.trimestres.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Seleccionados: Trimestre{formData.trimestres.length > 1 ? 's' : ''} {formData.trimestres.join(', ')}
              </p>
            )}
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

          {/* Días hábiles adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              + Días Hábiles (0-5)
            </label>
            <select
              value={editFechaData.dias_habiles}
              onChange={(e) => setEditFechaData({ ...editFechaData, dias_habiles: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            >
              {[0, 1, 2, 3, 4, 5].map(dias => (
                <option key={dias} value={dias}>
                  {dias} {dias === 1 ? 'día' : 'días'} hábil{dias !== 1 ? 'es' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Los días hábiles se agregarán a la fecha ingresada (excluye sábados y domingos).
            </p>
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
          {/* Información de la actividad */}
          {assigningActividadId && (() => {
            const actividad = actividades.find(a => a.id_actividad === assigningActividadId);
            if (!actividad) return null;
            
            return (
              <div className="bg-sedapal-cyan bg-opacity-10 border border-sedapal-cyan rounded-lg p-4">
                <h4 className="text-sm font-semibold text-sedapal-blue mb-2">📋 Información de la Actividad</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-gray-700">Actividad:</span> <span className="text-gray-900">{actividad.nombre_actividad || 'N/A'}</span></p>
                  <p><span className="font-medium text-gray-700">Sistema:</span> <span className="text-gray-900">{actividad.sistema_abrev || 'N/A'}</span></p>
                  <p><span className="font-medium text-gray-700">Gerencia:</span> <span className="text-gray-900">{actividad.gerencia_nombre || 'N/A'}</span></p>
                  <p><span className="font-medium text-gray-700">Equipo:</span> <span className="text-gray-900">{actividad.equipo_nombre || 'N/A'}</span></p>
                </div>
              </div>
            );
          })()}
          
          {/* Selector de modo */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setModoAsignacionUsuario('nuevo')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                modoAsignacionUsuario === 'nuevo'
                  ? 'bg-white text-sedapal-blue shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Crear Nuevo Usuario
            </button>
            <button
              type="button"
              onClick={() => setModoAsignacionUsuario('existente')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                modoAsignacionUsuario === 'existente'
                  ? 'bg-white text-sedapal-blue shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Usuario Existente
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
        entregableNombre={selectedActividadForEntregables?.entregable_nombre}
        activityName={selectedActividadForEntregables?.nombre_actividad}
        activityMaxDate={selectedActividadForEntregables?.fecha_sustento || null}
        activityCompletionStatus={selectedActividadForEntregables?.estado_actividad || null}
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
