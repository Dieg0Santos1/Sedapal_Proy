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
  notificacionesService,
  categoriasService,
  usuariosEquiposService
  } from '../services/api';
import type { ActividadConSistema, Sistema, Equipo, Gerencia, Entregable, TipoEntregable, Usuario } from '../services/api';
import Modal from '../components/Modal';
import ViewEntregablesModal from '../components/ViewEntregablesModal';
import confetti from 'canvas-confetti';
import { validarFechaEnTrimestre, getMensajeErrorFechaTrimestre, getNombreMesesTrimestre } from '../utils/trimestreUtils';
import { ACTIVIDADES_CATALOGO } from '../data/actividadesCatalog';
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
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Búsqueda, filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSistema, setFiltroSistema] = useState<number>(0);
  const [filtroGerencia, setFiltroGerencia] = useState<number>(0);
  const [filtroEquipo, setFiltroEquipo] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filtro por estado
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  
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
  const [usuariosAsignados, setUsuariosAsignados] = useState<Usuario[]>([]);
  const [asignarUsuarioError, setAsignarUsuarioError] = useState<string>('');
  
  // Nuevo flujo: Crear Usuario y vincularlo a Gerencia/Equipo
  const [isUsuarioEquipoModalOpen, setIsUsuarioEquipoModalOpen] = useState(false);
  const [nuevoUsuarioEquipoForm, setNuevoUsuarioEquipoForm] = useState({
    nombre: '', apellido: '', email: '', id_gerencia: 0, id_equipo: 0,
  });
  const [equiposFiltradosUE, setEquiposFiltradosUE] = useState<Equipo[]>([]);
  
  // Estados para edición
  const [editingActividadId, setEditingActividadId] = useState<number | null>(null);
  const [assigningActividadId, setAssigningActividadId] = useState<number | null>(null);
  const [cantidadCambios, setCantidadCambios] = useState<number>(0);
  const [usuariosExistentes, setUsuariosExistentes] = useState<any[]>([]);
  const [modoAsignacionUsuario, setModoAsignacionUsuario] = useState<'nuevo' | 'existente'>('nuevo');
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState<number | null>(null);
  
  // Form state: múltiples combinaciones gerencia-equipo-entregable
  const [formData, setFormData] = useState({
    nombre_actividad: '',
    id_sistema: 0,
    combinaciones: [] as Array<{ 
      id_gerencia: number; 
      id_equipo: number; 
      id_entregable: number; 
      gerencia_nombre: string; 
      equipo_nombre: string; 
      gerencia_abrev: string; 
      entregable_nombre: string; 
    }>,
    trimestres: [] as number[]
  });
  
  // Estados temporales para seleccionar gerencia/equipo/entregable
  const [selectedGerenciaId, setSelectedGerenciaId] = useState<number>(0);
  const [selectedEquipoId, setSelectedEquipoId] = useState<number>(0);
  const [selectedEntregableId, setSelectedEntregableId] = useState<number>(0);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number>(0);
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

  const groupActividades = (items: any[]) => {
    const map = new Map<string, any>();
    const statusPriority = (s: string | null) => s === 'completado' ? 3 : s === 'reprogramado' ? 2 : s === 'pendiente' ? 1 : 0;
    items.forEach((a: any) => {
      const key = `${a.nombre_actividad || ''}|${a.id_sistema || ''}|${a.id_gerencia || ''}|${a.id_equipo || ''}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...a,
          actividad_ids: [a.id_actividad],
          entregables_lista: a.entregable_nombre ? [a.entregable_nombre] : [],
          entregables_ids: a.id_entregable ? [a.id_entregable] : [],
          usuarios_asignados: (a as any).usuarios_asignados || 0,
          trimestres: Array.isArray((a as any).trimestres) ? [...(a as any).trimestres] : (a.trimestre ? [a.trimestre] : []),
        });
      } else {
        existing.actividad_ids.push(a.id_actividad);
        if (a.entregable_nombre && !existing.entregables_lista.includes(a.entregable_nombre)) {
          existing.entregables_lista.push(a.entregable_nombre);
        }
        if (a.id_entregable && !existing.entregables_ids.includes(a.id_entregable)) {
          existing.entregables_ids.push(a.id_entregable);
        }
        existing.usuarios_asignados = (existing.usuarios_asignados || 0) + ((a as any).usuarios_asignados || 0);
        // Estado: si todos completado -> completado; si alguno reprogramado -> reprogramado; else pendiente
        const states = [existing.estado_actividad, a.estado_actividad];
        if (states.every((s: any) => s === 'completado')) existing.estado_actividad = 'completado';
        else if (states.some((s: any) => s === 'reprogramado')) existing.estado_actividad = 'reprogramado';
        else existing.estado_actividad = 'pendiente';
        existing.en_revision = existing.en_revision || a.en_revision;
        // fecha_sustento: elegir la máxima
        if (a.fecha_sustento && (!existing.fecha_sustento || a.fecha_sustento > existing.fecha_sustento)) {
          existing.fecha_sustento = a.fecha_sustento;
        }
        // trimestres: unión
        const newTrims = Array.isArray((a as any).trimestres) ? (a as any).trimestres : (a.trimestre ? [a.trimestre] : []);
        existing.trimestres = Array.from(new Set([...(existing.trimestres || []), ...newTrims])).sort();
      }
    });
    return Array.from(map.values());
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [actData, sisData, eqData, gerData, tiposEntData, cats] = await Promise.all([
        adminActividadesService.getActividadesByAdmin(idAdmin),
        adminSistemasService.getSistemasByAdmin(idAdmin),
        equiposService.getAll(),
        gerenciasService.getAll(),
        tiposEntregablesService.getAll(),
        categoriasService.getAll()
      ]);
      console.log('Gerencias cargadas:', gerData);
      console.log('Equipos cargados:', eqData);
      console.log('Tipos de entregables cargados:', tiposEntData);
      setActividades(groupActividades(actData));
      setSistemasDelegados(sisData);
      setEquipos(eqData);
      setGerencias(gerData);
      setTiposEntregables(tiposEntData);
      setCategorias(cats);
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
      const usuarios = await usuariosEquiposService.getUsuariosConEquipo();
      setUsuariosExistentes(usuarios);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  // Agregar entregable al grupo (desde el modal)
  const handleAddEntregableToGroup = async (idEnt: number) => {
    try {
      if (!selectedActividadForEntregables) return;
      const base: any = { ...(selectedActividadForEntregables as any) };
      // Crear nueva actividad clonando metadatos del grupo
      // Asegurar id_sistema válido (puede faltar en objetos agrupados)
      const idSistemaFinal = base.id_sistema || (sistemasDelegados.find(s => s.abrev === base.sistema_abrev)?.id) || 0;
      if (!idSistemaFinal) throw new Error('No se pudo determinar el sistema para la relación');
      const nueva = await actividadesService.create({
        nombre_actividad: base.nombre_actividad,
        id_sistema: idSistemaFinal,
        trimestre: base.trimestre || (Array.isArray(base.trimestres) ? base.trimestres[0] : 1),
        trimestres: Array.isArray(base.trimestres) ? base.trimestres : [base.trimestre || 1],
        estado_actividad: 'pendiente',
        fecha_sustento: base.fecha_sustento || null,
        evaluacion: 'pendiente',
        cod_cat_int: base.cod_cat_int || 1,
        id_gerencia: base.id_gerencia,
        id_equipo: base.id_equipo,
        id_entregable: idEnt
      });
      // Registrar admin creador
      await adminActividadesService.registerActividad(idAdmin, nueva.id_actividad);
      // Asignar a todos los usuarios ya asignados en el grupo
      let usuariosGrupo: any[] = [];
      const idsGrupo: number[] = (base.actividad_ids || [base.id_actividad]) as number[];
      for (const aid of idsGrupo) {
        const us = await usuarioActividadesService.getUsuariosByActividad(aid);
        usuariosGrupo = usuariosGrupo.concat(us || []);
      }
      const uniqueUsuarios = Array.from(new Set(usuariosGrupo.map((u: any) => u.id_usuario)));
      for (const uid of uniqueUsuarios) {
        try { await usuarioActividadesService.assign(uid, nueva.id_actividad); } catch {}
      }
      // Actualizar estado local del modal
      const nuevoNombre = (tiposEntregables.find(t => t.id_entregable === idEnt)?.nombre_entregables || `Entregable #${idEnt}`).trim();
      base.entregables_lista = Array.from(new Set([...(base.entregables_lista || []), nuevoNombre]));
      base.entregables_ids = Array.from(new Set([...(base.entregables_ids || []), idEnt]));
      base.actividad_ids = Array.from(new Set([...(base.actividad_ids || []), nueva.id_actividad]));
      setSelectedActividadForEntregables(base);
      // Actualizar listado detallado del modal inmediatamente
      setDetalleEntregables(prev => Array.from(new Set([...(prev || []), { id: idEnt, nombre: nuevoNombre, actividadId: nueva.id_actividad }]) as any));
      await loadData();
    } catch (e: any) {
      console.error('Error al agregar entregable', e);
      alert('No se pudo agregar el entregable: ' + (e?.message || 'Error desconocido'));
    }
  };

  const loadUsuariosAsignados = async (actividadId: number) => {
    try {
      const asignados = await usuarioActividadesService.getUsuariosByActividad(actividadId);
      setUsuariosAsignados(asignados);
    } catch (err) {
      console.error('Error al cargar usuarios asignados:', err);
      setUsuariosAsignados([]);
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
      nombre_actividad: ACTIVIDADES_CATALOGO[0] || '',
      id_sistema: sistemasDelegados[0]?.id || 0,
      combinaciones: [],
      trimestres: []
    });
    // No pre-seleccionar gerencia/equipo/entregable, dejar en 0 para que el usuario elija
    setSelectedGerenciaId(0);
    setSelectedEquipoId(0);
    setSelectedEntregableId(0);
    setEquiposFiltrados([]);
    setSelectedCategoriaId((categorias[0]?.id_categoria) || 0);
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

  // Agregar combinación gerencia-equipo-entregable
  const handleAgregarGerenciaEquipo = () => {
    if (selectedGerenciaId === 0 || selectedEquipoId === 0 || selectedEntregableId === 0) {
      setError('Debes seleccionar gerencia, equipo y tipo de entregable');
      return;
    }

    // Verificar que no se repita la combinación exacta
    const existe = formData.combinaciones.some(
      c => c.id_gerencia === selectedGerenciaId && c.id_equipo === selectedEquipoId && c.id_entregable === selectedEntregableId
    );

    if (existe) {
      setError('Esta combinación ya está agregada');
      return;
    }

    const gerencia = gerencias.find(g => g.id_gerencia === selectedGerenciaId);
    const equipo = equiposFiltrados.find(e => e.id_equipo === selectedEquipoId);
    const entregable = tiposEntregables.find(t => t.id_entregable === selectedEntregableId);

    if (!gerencia || !equipo || !entregable) return;

    setFormData({
      ...formData,
      combinaciones: [
        ...formData.combinaciones,
        {
          id_gerencia: selectedGerenciaId,
          id_equipo: selectedEquipoId,
          id_entregable: selectedEntregableId,
          id_categoria: selectedCategoriaId,
          gerencia_nombre: gerencia.des_gerencia,
          equipo_nombre: equipo.desc_equipo,
          gerencia_abrev: gerencia.abrev || 'N/A',
          entregable_nombre: (entregable.nombre_entregables || '').trim() || `Entregable #${entregable.id_entregable}`,
          categoria_nombre: (categorias.find(c => c.id_categoria === selectedCategoriaId)?.nombre) || 'General'
        }
      ]
    });
    setError('');
  };

  // Eliminar combinación de la lista
  const handleEliminarGerenciaEquipo = (index: number) => {
    setFormData({
      ...formData,
      combinaciones: formData.combinaciones.filter((_, i) => i !== index)
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
      if (formData.combinaciones.length === 0) {
        setError('Debes agregar al menos una combinación de gerencia, equipo y entregable');
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

      // Para cada combinación, crear una actividad
      for (const c of formData.combinaciones) {
        const nuevaActividad = await actividadesService.create({
          nombre_actividad: formData.nombre_actividad,
          id_sistema: formData.id_sistema,
          id_equipo: c.id_equipo,
          id_gerencia: c.id_gerencia,
          id_entregable: c.id_entregable,
          cod_cat_int: c.id_categoria || 1,
          trimestre: ultimoTrimestre,
          trimestres: formData.trimestres,
          estado_actividad: 'pendiente',
          fecha_sustento: fechaMaximaStr,
          evaluacion: 'pendiente'
        });

        // Registrar que el admin creó esta actividad
        await adminActividadesService.registerActividad(idAdmin, nuevaActividad.id_actividad);

        // Notificar y ASIGNAR automáticamente a todos los usuarios del equipo
        try {
          const usuariosEquipo = await usuariosEquiposService.getUsuariosByEquipo(c.id_equipo);
          const sis = sistemasDelegados.find(s => s.id === formData.id_sistema);
          const equipoNombre = (equipos.find(e => e.id_equipo === c.id_equipo)?.desc_equipo) || 'N/A';
          for (const u of (usuariosEquipo || [])) {
            // Enviar correo de actividad asignada
            await notificacionesService.enviarNotificacionActividad(
              u.email,
              `${u.nombre} ${u.apellido}`,
              formData.nombre_actividad,
              sis?.abrev || 'N/A',
              equipoNombre,
              ultimoTrimestre,
              fechaMaximaStr
            );
            // Asignar al usuario para que figure como asignado (pinta verde)
            try { await usuarioActividadesService.assign(u.id_usuario, nuevaActividad.id_actividad); } catch {}
          }
        } catch (e) {
          console.warn('No se pudo notificar/asignar usuarios del equipo:', e);
        }
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
    setAsignarUsuarioError('');
    setIsAsignarUsuarioModalOpen(true);
    loadUsuariosAsignados(actividadId);
  };

  const [detalleEntregables, setDetalleEntregables] = useState<Array<{ id: number; nombre: string; actividadId: number }>>([]);

  const handleOpenViewEntregables = async (actividad: ActividadConSistema | any) => {
    try {
      setSelectedActividadForEntregables(actividad);
      setIsViewEntregablesModalOpen(true);
      // Construir mapeo entregable -> actividadId
      const idsGrupo: number[] = (actividad.actividad_ids || [actividad.id_actividad]) as number[];
      const acts = await actividadesService.getByIds(idsGrupo);
      const detalle = acts.map((a: any) => {
        const nombre = (tiposEntregables.find(t => t.id_entregable === a.id_entregable)?.nombre_entregables || `Entregable #${a.id_entregable}`).trim();
        return { id: a.id_entregable, nombre, actividadId: a.id_actividad };
      }).filter((d: any) => d.id);
      setDetalleEntregables(detalle);
    } catch (err: any) {
      setError('Error al cargar entregables: ' + err.message);
    }
  };

  const handleRemoveEntregableFromGroup = async (idEnt: number) => {
    try {
      const item = detalleEntregables.find(d => d.id === idEnt);
      if (!item) throw new Error('No se encontró el entregable');
      await actividadesService.deleteWithRelations(item.actividadId);
      // Actualizar estado local
      setDetalleEntregables(detalleEntregables.filter(d => d.id !== idEnt));
      if (selectedActividadForEntregables) {
        const base: any = { ...(selectedActividadForEntregables as any) };
        base.entregables_lista = (base.entregables_lista || []).filter((n: string, idx: number) => detalleEntregables[idx]?.id !== idEnt);
        base.entregables_ids = (base.entregables_ids || []).filter((eid: number) => eid !== idEnt);
        base.actividad_ids = (base.actividad_ids || []).filter((aid: number) => aid !== item.actividadId);
        setSelectedActividadForEntregables(base);
      }
      await loadData();
    } catch (e: any) {
      alert('No se pudo quitar el entregable: ' + (e?.message || ''));
    }
  };

  const handleChangeActivityStatus = async (status: 'conforme') => {
    if (!selectedActividadForEntregables) return;

    try {
      const ids: number[] = (selectedActividadForEntregables as any).actividad_ids || [selectedActividadForEntregables.id_actividad];
      // Marcar todas como completado
      for (const id of ids) {
        await actividadesService.update(id, { evaluacion: 'conforme', estado_actividad: 'completado' });
      }

      // Notificar a usuarios y superadmins (una sola vez, agregando todos los usuarios)
      try {
        let usuariosAsignadosAll: any[] = [];
        for (const id of ids) {
          const u = await usuarioActividadesService.getUsuariosByActividad(id);
          usuariosAsignadosAll = usuariosAsignadosAll.concat(u || []);
        }
        const uniqueUsuarios = Array.from(new Set(usuariosAsignadosAll.map((u: any) => u.email)));
        let superadmins: any[] = [];
        try {
          if ((usuariosService as any).getSuperadmins) {
            superadmins = await (usuariosService as any).getSuperadmins();
          }
        } catch (e) {
          console.warn('No se pudo obtener superadmins:', e);
        }
        await notificacionesService.enviarConforme({
          usuariosDestino: uniqueUsuarios,
          superadminsDestino: (superadmins || []).map(sa => sa.email),
          nombreActividad: selectedActividadForEntregables.nombre_actividad || 'Actividad',
          entregableNombre: ((selectedActividadForEntregables as any).entregables_lista || [selectedActividadForEntregables.entregable_nombre]).join(', '),
          sistemaAbrev: selectedActividadForEntregables.sistema_abrev || 'N/A',
          equipoNombre: selectedActividadForEntregables.equipo_nombre || 'N/A',
          fechaMaxima: selectedActividadForEntregables.fecha_sustento || null
        });
      } catch (e) {
        console.warn('No se pudo notificar conforme:', e);
      }

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
    setAsignarUsuarioError('');

    try {
      if (modoAsignacionUsuario === 'nuevo') {
        // Validación: correo único
        const existente = await usuariosService.getByEmail(usuarioFormData.email);
        if (existente) {
          setAsignarUsuarioError('El correo ya fue registrado previamente.');
          setIsSubmitting(false);
          return;
        }

        // Crear nuevo usuario vía backend con detalle de actividad (envía correo automático)
        const normalizeName = (s: string) => s.trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const nombreN = normalizeName(usuarioFormData.nombre);
        const apellidoN = normalizeName(usuarioFormData.apellido);

        const actividadBase = actividades.find(a => a.id_actividad === assigningActividadId) as any;
        const trimestreMail = actividadBase?.trimestre || (Array.isArray(actividadBase?.trimestres) ? actividadBase.trimestres[0] : 1);
        const creado = await usuariosService.createUsuarioConActividad({
          nombre: nombreN,
          apellido: apellidoN,
          email: usuarioFormData.email.trim(),
          nombreActividad: actividadBase?.nombre_actividad || 'Actividad',
          sistemaAbrev: actividadBase?.sistema_abrev || 'N/A',
          equipoNombre: actividadBase?.equipo_nombre || 'N/A',
          trimestre: trimestreMail,
          fechaMaxima: actividadBase?.fecha_sustento || null
        });

        const newUserId = (creado as any).id || (creado as any).id_usuario;

        // Asignar al grupo completo (todas las actividades hermanas)
        const grupo = actividades.find(a => a.id_actividad === assigningActividadId) as any;
        const idsGrupo: number[] = (grupo?.actividad_ids || [assigningActividadId]) as number[];
        for (const aid of idsGrupo) {
          try { await usuarioActividadesService.assign(newUserId, aid); } catch {}
        }

        // Vincular usuario a equipo/gerencia de la actividad para visibilidad futura
        if (actividadBase?.id_equipo && actividadBase?.id_gerencia) {
          try { await usuariosEquiposService.assign(newUserId, actividadBase.id_gerencia, actividadBase.id_equipo); } catch {}
        }

        // Guardar credenciales para mostrar (backend devuelve contraseña)
        setCreatedUserData({
          email: usuarioFormData.email,
          password: (creado as any)?.contrasena || ''
        });

        setIsSuccessModalOpen(true);
        
        // Recargar lista de usuarios
        await loadUsuariosExistentes();
        
        // Correo ya enviado por el backend automáticamente
      } else {
        // Asignar usuario existente a la actividad
        if (!usuarioSeleccionadoId) {
          setError('Debes seleccionar un usuario');
          setIsSubmitting(false);
          return;
        }

        // Asignar usuario existente a todas las actividades del grupo
        const grupo = actividades.find(a => a.id_actividad === assigningActividadId) as any;
        const idsGrupo: number[] = (grupo?.actividad_ids || [assigningActividadId]) as number[];
        for (const aid of idsGrupo) {
          try { await usuarioActividadesService.assign(usuarioSeleccionadoId, aid); } catch {}
        }
        await loadUsuariosAsignados(assigningActividadId);
        
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
      
      // refrescar lista para reflejar cambios (indicadores / agrupación)
      await loadData();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      });
    } catch (err: any) {
      const msg: string = (err?.message || '').toLowerCase();
      if (err?.code === '23505' || msg.includes('duplicate key') || msg.includes('ya existe') || msg.includes('duplicate')) {
        setAsignarUsuarioError('El usuario ya está asignado a esta actividad.');
      } else {
        setAsignarUsuarioError('Error al asignar usuario: ' + (err?.message || ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar actividades
  const actividadesFiltradas = actividades.filter(act => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (act.nombre_actividad?.toLowerCase().includes(term) || false) ||
      (act.sistema_abrev?.toLowerCase().includes(term) || false) ||
      (act.equipo_nombre?.toLowerCase().includes(term) || false) ||
      (act.gerencia_nombre?.toLowerCase().includes(term) || false) ||
      (act.gerencia_abrev?.toLowerCase().includes(term) || false);
    
    const matchesSistema = filtroSistema === 0 || act.id_sistema === filtroSistema;
    const matchesGerencia = filtroGerencia === 0 || act.id_gerencia === filtroGerencia;
    const matchesEquipo = filtroEquipo === 0 || act.id_equipo === filtroEquipo;
    const matchesEstado = filtroEstado === '' ||
      (filtroEstado === 'revision' ? ((act as any).en_revision && act.estado_actividad !== 'completado') : act.estado_actividad === filtroEstado);
    
    return matchesSearch && matchesSistema && matchesGerencia && matchesEquipo && matchesEstado;
  });

  // Paginación
  const totalPages = Math.ceil(actividadesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const actividadesPaginadas = actividadesFiltradas.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroSistema, filtroGerencia, filtroEquipo, filtroEstado]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // abrir modal NUEVO para crear usuario y vincular a equipo
              setNuevoUsuarioEquipoForm({ nombre: '', apellido: '', email: '', id_gerencia: 0, id_equipo: 0 });
              setEquiposFiltradosUE([]);
              setIsUsuarioEquipoModalOpen(true);
            }}
            className="flex items-center px-4 py-2 border-2 border-sedapal-lightBlue text-sedapal-blue rounded-lg hover:bg-sedapal-lightBlue hover:text-white transition"
            disabled={actividades.length === 0}
            title="Usuario/Equipo"
          >
            <UserPlus size={18} className="mr-2" />
            Usuario/Equipo
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition"
            disabled={sistemasDelegados.length === 0}
          >
            <Plus size={20} className="mr-2" />
            Añadir Actividad
          </button>
        </div>
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
      <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        {/* Búsqueda */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, sistema, gerencia o equipo..."
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

        {/* Filtro por gerencia */}
        <div>
          <select
            value={filtroGerencia}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setFiltroGerencia(val);
              setFiltroEquipo(0); // reset equipo cuando cambia gerencia
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
          >
            <option value={0}>Todas las gerencias</option>
            {gerencias.map(g => (
              <option key={g.id_gerencia} value={g.id_gerencia}>
                {g.des_gerencia}{g.abrev ? ` - ${g.abrev}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por equipo (dependiente de gerencia) */}
        <div>
          <select
            value={filtroEquipo}
            onChange={(e) => setFiltroEquipo(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
          >
            <option value={0}>Todos los equipos</option>
            {(filtroGerencia ? equipos.filter(eq => eq.id_gerencia === filtroGerencia) : equipos).map(eq => (
              <option key={eq.id_equipo || eq.id} value={eq.id_equipo || (eq.id as number)}>
                {eq.desc_equipo} - {gerencias.find(g => g.id_gerencia === (eq.id_gerencia as number))?.abrev || ''}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por estado */}
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

        {/* Limpiar filtros */}
        <div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFiltroSistema(0);
              setFiltroGerencia(0);
              setFiltroEquipo(0);
              setCurrentPage(1);
              setFiltroEstado('');
            }}
            className="w-full px-3 py-2 text-sm border-2 border-sedapal-cyan text-sedapal-blue rounded-lg hover:bg-sedapal-cyan hover:text-white transition flex items-center justify-center gap-2"
          >
            <X size={16} /> Limpiar filtros
          </button>
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
                  {searchTerm || filtroSistema !== 0 || filtroGerencia !== 0 || filtroEquipo !== 0 ? 'No se encontraron resultados' : 'No has creado actividades aún'}
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
                    {(() => {
                      const enRevision = (actividad as any).en_revision && actividad.estado_actividad !== 'completado';
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
          {/* Nombre de la actividad (catálogo) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actividad *
            </label>
            <select
              required
              value={formData.nombre_actividad}
              onChange={(e) => setFormData({ ...formData, nombre_actividad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
            >
              {ACTIVIDADES_CATALOGO.map((nombre, idx) => (
                <option key={idx} value={nombre}>{nombre}</option>
              ))}
            </select>
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

          {/* Selección de Gerencia, Equipo y Entregable */}

          {/* Gerencia, Equipo, Entregable y Categoría */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Asignaciones (Gerencia, Equipo, Entregable y Categoría)</h3>
            
            <div className="grid grid-cols-4 gap-3 mb-3">
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
                  Categoría ({categorias.length})
                </label>
                <select
                  value={selectedCategoriaId}
                  onChange={(e) => setSelectedCategoriaId(parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
                >
                  <option value={0}>Selecciona una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
                  ))}
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

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Entregable ({tiposEntregables.length})
                </label>
                <select
                  value={selectedEntregableId}
                  onChange={(e) => setSelectedEntregableId(parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
                >
                  <option value={0}>Selecciona un entregable</option>
                  {tiposEntregables.map(tipo => (
                    <option key={tipo.id_entregable} value={tipo.id_entregable}>
                      {(tipo.nombre_entregables || '').trim() || `Entregable #${tipo.id_entregable}`}
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
              + Agregar Asignación
            </button>

            {/* Lista de combinaciones agregadas */}
            {formData.combinaciones.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-600">Agregados:</p>
                {formData.combinaciones.map((c, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <div className="text-xs">
                      <span className="font-semibold text-sedapal-blue">{c.gerencia_nombre}</span>
                      <span className="text-gray-500"> → </span>
                      <span className="text-gray-700">{c.equipo_nombre}</span>
                      <span className="text-gray-500"> • </span>
                      <span className="text-gray-700">{c.entregable_nombre}</span>
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

          {/* Fechas máximas por trimestre (informativas) */}
          {editingActividadId && (() => {
            const act = actividades.find(a => a.id_actividad === editingActividadId) as any;
            if (!act) return null;
            const trims: number[] = Array.isArray(act.trimestres) ? act.trimestres : (act.trimestre ? [act.trimestre] : []);
            const hoy = new Date();
            const trimestreActual = Math.floor(hoy.getMonth() / 3) + 1;
            const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            return (
              <div className="border-2 border-sedapal-lightBlue rounded-lg">
                <div className="px-4 py-2 border-b-2 border-sedapal-lightBlue text-sedapal-lightBlue font-semibold">Fechas por Trimestre</div>
                <div className="divide-y divide-sedapal-lightBlue/40">
                  {trims.map((t: number) => {
                    const fecha = calcularFechaMaxima([t], 0);
                    const estado = t < trimestreActual ? 'Cerrado' : (t === trimestreActual ? 'Activo' : 'Bloqueado');
                    const color = t < trimestreActual ? 'text-gray-500' : (t === trimestreActual ? 'text-green-600' : 'text-orange-600');
                    return (
                      <div key={t} className="px-4 py-2 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">Trimestre {t}</span>
                          <span className="ml-2 text-gray-700">Fecha máxima: {format(fecha)}</span>
                        </div>
                        <span className={`text-xs font-semibold ${color}`}>{estado}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Fecha Máxima * (aplica al trimestre activo)
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
        onClose={() => { setIsAsignarUsuarioModalOpen(false); setAsignarUsuarioError(''); }}
        title="Asignar Usuario a Actividad"
      >
        <form onSubmit={handleAsignarUsuario} className="space-y-4">
          {asignarUsuarioError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
              {asignarUsuarioError}
            </div>
          )}
          {/* Información de la actividad */}
          {assigningActividadId && (() => {
            const actividad = actividades.find(a => a.id_actividad === assigningActividadId);
            if (!actividad) return null;
            
            return (
              <div className="bg-sedapal-cyan bg-opacity-10 border border-sedapal-cyan rounded-lg p-4">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1 text-sm">
                    <h4 className="text-sm font-semibold text-sedapal-blue mb-2">📋 Información de la Actividad</h4>
                    <p><span className="font-medium text-gray-700">Actividad:</span> <span className="text-gray-900">{actividad.nombre_actividad || 'N/A'}</span></p>
                    <p><span className="font-medium text-gray-700">Sistema:</span> <span className="text-gray-900">{actividad.sistema_abrev || 'N/A'}</span></p>
                    <p><span className="font-medium text-gray-700">Gerencia:</span> <span className="text-gray-900">{actividad.gerencia_nombre || 'N/A'}</span></p>
                    <p><span className="font-medium text-gray-700">Equipo:</span> <span className="text-gray-900">{actividad.equipo_nombre || 'N/A'}</span></p>
                  </div>
                  <div className="min-w-[220px]">
                    <h5 className="text-sm font-semibold text-sedapal-blue mb-2">Usuarios Asignados:</h5>
                    {usuariosAsignados.length === 0 ? (
                      <p className="text-sm text-gray-600">Ninguno</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                        {usuariosAsignados.map(u => (
                          <li key={u.id_usuario}>{u.nombre} {u.apellido} ({u.email})</li>
                        ))}
                      </ul>
                    )}
                  </div>
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
                  {(() => {
                    const actividad = actividades.find(a => a.id_actividad === assigningActividadId);
                    const equipoActividad = actividad?.id_equipo || null;
                    return usuariosExistentes
                      .filter(u => !usuariosAsignados.some(ua => ua.id_usuario === u.id_usuario))
                      .filter(u => (u.id_equipo || null) === equipoActividad)
                      .map((usuario) => (
                        <option key={usuario.id_usuario} value={usuario.id_usuario}>
                          {usuario.nombre} {usuario.apellido} ({usuario.email})
                        </option>
                      ));
                  })()}
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
          entregablesNombres={(selectedActividadForEntregables as any)?.entregables_lista}
          entregablesDetalle={detalleEntregables?.map(d => ({ id: d.id, nombre: d.nombre }))}
          onRemoveEntregable={handleRemoveEntregableFromGroup}
          activityName={selectedActividadForEntregables?.nombre_actividad}
          activityMaxDate={selectedActividadForEntregables?.fecha_sustento || null}
          activityCompletionStatus={selectedActividadForEntregables?.estado_actividad || null}
          onChangeStatus={handleChangeActivityStatus}
          isAdmin
          canApprove={Boolean((selectedActividadForEntregables as any)?.en_revision)}
          canModifyEntregables={!(selectedActividadForEntregables as any)?.en_revision && (selectedActividadForEntregables?.estado_actividad !== 'completado')}
          addOptions={(() => {
            const used = new Set(((selectedActividadForEntregables as any)?.entregables_ids || []) as number[]);
            return tiposEntregables
              .filter(t => !used.has(t.id_entregable))
              .map(t => ({ id: t.id_entregable, nombre: (t.nombre_entregables || '').trim() || `Entregable #${t.id_entregable}` }));
          })()}
          onAddEntregable={handleAddEntregableToGroup}
        />

      {/* Modal: Crear Usuario y vincular a Equipo */}
      <Modal
        isOpen={isUsuarioEquipoModalOpen}
        onClose={() => setIsUsuarioEquipoModalOpen(false)}
        title="Crear Usuario y Vincular a Equipo"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          setIsSubmitting(true);
          setAsignarUsuarioError('');
          try {
            // Validaciones básicas
            if (!nuevoUsuarioEquipoForm.nombre.trim() || !nuevoUsuarioEquipoForm.apellido.trim() || !nuevoUsuarioEquipoForm.email.trim()) {
              setAsignarUsuarioError('Completa nombre, apellido y email');
              setIsSubmitting(false);
              return;
            }
            if (!nuevoUsuarioEquipoForm.id_gerencia || !nuevoUsuarioEquipoForm.id_equipo) {
              setAsignarUsuarioError('Selecciona gerencia y equipo');
              setIsSubmitting(false);
              return;
            }

            // Validar email único via backend
            const existente = await usuariosService.getByEmail(nuevoUsuarioEquipoForm.email.trim());
            if (existente) {
              setAsignarUsuarioError('El correo ya fue registrado previamente.');
              setIsSubmitting(false);
              return;
            }

            // Crear usuario con contraseña generada
            const normalizeName = (s: string) => s.trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const nombreN = normalizeName(nuevoUsuarioEquipoForm.nombre);
            const apellidoN = normalizeName(nuevoUsuarioEquipoForm.apellido);
            const inicialNombre = nombreN.charAt(0).toUpperCase();
            const inicialApellido = apellidoN.charAt(0).toUpperCase();
            const dosDigitos = Math.floor(Math.random() * 90 + 10);
            const contrasenaGenerada = `User${inicialNombre}${inicialApellido}${dosDigitos}`;

            // Crear usuario usando backend (genera contraseña y envía correo base)
            const creado = await usuariosService.createUsuarioBackend({
              nombre: nombreN,
              apellido: apellidoN,
              email: nuevoUsuarioEquipoForm.email.trim(),
              contrasena: contrasenaGenerada,
            });
            const userId = (creado as any).id ?? (creado as any).id_usuario; // backend retorna 'id'
            const passwordResp = (creado as any).contrasena || contrasenaGenerada; // fallback por si el backend no la retorna

            // Vincular al equipo seleccionado
            if (!userId) throw new Error('No se pudo obtener el ID del nuevo usuario');
            console.log('🔍 DEBUG - Asignando equipo:', {
              userId,
              id_gerencia: nuevoUsuarioEquipoForm.id_gerencia,
              id_equipo: nuevoUsuarioEquipoForm.id_equipo
            });
            await usuariosEquiposService.assign(userId, nuevoUsuarioEquipoForm.id_gerencia, nuevoUsuarioEquipoForm.id_equipo);

            // Notificar credenciales + pertenencia (siguiendo estructura de notificaciones)
            const gerNombre = gerencias.find(g => g.id_gerencia === nuevoUsuarioEquipoForm.id_gerencia)?.des_gerencia || 'N/A';
            const eqNombre = equipos.find(e => e.id_equipo === nuevoUsuarioEquipoForm.id_equipo)?.desc_equipo || 'N/A';
            try {
              await notificacionesService.enviarUsuarioCreado({
                email: nuevoUsuarioEquipoForm.email.trim(),
                nombreUsuario: `${nombreN} ${apellidoN}`,
                contrasena: passwordResp,
                gerenciaNombre: gerNombre,
                equipoNombre: eqNombre,
              });
            } catch (e) {
              console.warn('No se pudo enviar correo de usuario creado:', e);
            }

            setCreatedUserData({ email: nuevoUsuarioEquipoForm.email.trim(), password: passwordResp });
            setIsUsuarioEquipoModalOpen(false);
            setIsSuccessModalOpen(true);
            await loadUsuariosExistentes();
          } catch (err: any) {
            setAsignarUsuarioError(err?.message || 'Error al crear usuario');
          } finally {
            setIsSubmitting(false);
          }
        }} className="space-y-4">
          {asignarUsuarioError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">{asignarUsuarioError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-sedapal-cyan rounded-lg text-sedapal-blue focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue" value={nuevoUsuarioEquipoForm.nombre}
                onChange={e => setNuevoUsuarioEquipoForm({ ...nuevoUsuarioEquipoForm, nombre: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-sedapal-cyan rounded-lg text-sedapal-blue focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue" value={nuevoUsuarioEquipoForm.apellido}
                onChange={e => setNuevoUsuarioEquipoForm({ ...nuevoUsuarioEquipoForm, apellido: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
              <input type="email" className="w-full px-3 py-2 border-2 border-sedapal-cyan rounded-lg text-sedapal-blue focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue" value={nuevoUsuarioEquipoForm.email}
                onChange={e => setNuevoUsuarioEquipoForm({ ...nuevoUsuarioEquipoForm, email: e.target.value })} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gerencia *</label>
              <select className="w-full px-3 py-2 border-2 border-sedapal-cyan rounded-lg bg-white text-sedapal-blue focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue" value={nuevoUsuarioEquipoForm.id_gerencia}
                onChange={(e) => {
                  const idg = parseInt(e.target.value);
                  setNuevoUsuarioEquipoForm({ ...nuevoUsuarioEquipoForm, id_gerencia: idg, id_equipo: 0 });
                  const filtered = equipos.filter(eq => eq.id_gerencia === idg);
                  setEquiposFiltradosUE(filtered);
                }} required>
                <option value={0}>Selecciona una gerencia</option>
                {gerencias.map(g => (
                  <option key={g.id_gerencia} value={g.id_gerencia}>{g.des_gerencia}{g.abrev ? ` - ${g.abrev}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo *</label>
              <select className="w-full px-3 py-2 border-2 border-sedapal-cyan rounded-lg bg-white text-sedapal-blue focus:ring-2 focus:ring-sedapal-lightBlue focus:border-sedapal-lightBlue disabled:bg-gray-100" value={nuevoUsuarioEquipoForm.id_equipo}
                onChange={(e) => setNuevoUsuarioEquipoForm({ ...nuevoUsuarioEquipoForm, id_equipo: parseInt(e.target.value) })} required disabled={equiposFiltradosUE.length === 0}>
                <option value={0}>Selecciona un equipo</option>
                {equiposFiltradosUE.map(eq => (
                  <option key={eq.id_equipo} value={eq.id_equipo}>{eq.desc_equipo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setIsUsuarioEquipoModalOpen(false)} className="px-4 py-2 border-2 border-sedapal-cyan text-sedapal-blue rounded-lg hover:bg-sedapal-cyan hover:text-white transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition disabled:opacity-50">{isSubmitting ? 'Creando...' : 'Crear Usuario'}</button>
          </div>
        </form>
      </Modal>

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
