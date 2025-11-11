import { supabase } from '../lib/supabase';

// ============================================
// TIPOS DE DATOS
// ============================================
export type Sistema = {
  id: number;
  desc_sistema: string;
  abrev: string | null;
  administrador: string | null;
  suplente: string | null;
  estado: number;
};

export type Actividad = {
  id_actividad: number;
  nombre_actividad: string | null;
  cod_cat_int: number;
  id_empresa: number | null;
  estado: boolean | null;
  trimestre: number | null;
  trimestres?: number[] | null; // Array de trimestres seleccionados
  fecha_sustento: string | null;
  evaluacion: 'conforme' | 'pendiente' | 'no conforme' | null;
  estado_actividad: 'pendiente' | 'reprogramado' | 'completado' | null;
};

export type ActividadConSistema = Actividad & {
  sistema_abrev?: string;
  entregable_nombre?: string;
  equipo_nombre?: string;
  gerencia_nombre?: string;
  gerencia_abrev?: string;
  id_sistema?: number;
  id_equipo?: number;
  id_gerencia?: number;
};

export type Equipo = {
  id_equipo?: number;
  id?: number;
  desc_equipo: string;
  nombre_equipo?: string; // Alias para compatibilidad
  id_gerencia?: number;
  estado?: number;
};

export type Gerencia = {
  id_gerencia: number;
  des_gerencia: string;
  abrev?: string;
  estado?: number;
};

export type Usuario = {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'superadmin' | 'admin' | 'usuario';
  fecha_creacion?: string;
  estado?: boolean;
};

export type AdminSistema = {
  id: number;
  id_admin: number;
  id_sistema: number;
  fecha_asignacion?: string;
};

export type UsuarioActividad = {
  id: number;
  id_usuario: number;
  id_actividad: number;
  fecha_asignacion?: string;
  cumplimiento: 'cumple' | 'no_cumple' | 'pendiente';
};

export type Entregable = {
  id: number;
  id_actividad: number;
  nombre_archivo: string;
  ruta_archivo: string;
  fecha_subida: string;
  subido_por: number;
  tamaño_archivo?: number;
};

export type TipoEntregable = {
  id_entregable: number;
  nombre_entregables: string; // Nota: el campo en la BD se llama 'nombre_entregables' (plural)
  estado?: boolean | null;
};

export type Categoria = {
  id_categoria: number; // puede variar en BD; mapearemos dinámicamente
  nombre: string;
};

// ============================================
// GERENCIAS
// ============================================
export const gerenciasService = {
  // Obtener todas las gerencias activas
  async getAll(): Promise<Gerencia[]> {
    const { data, error } = await supabase
      .from('tb_gerencias')
      .select('*')
      .eq('estado', true)
      .order('id_gerencia', { ascending: true });

    if (error) {
      console.error('Error al cargar gerencias desde Supabase:', error);
      throw error;
    }
    console.log('Gerencias obtenidas:', data);
    return data || [];
  },
  // Obtener todas (incluye inactivas) para pantalla de configuración
  async getAllAdmin(): Promise<Gerencia[]> {
    const { data, error } = await supabase
      .from('tb_gerencias')
      .select('*')
      .order('id_gerencia', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  // Cambiar estado (activar/desactivar)
  async updateEstado(idGerencia: number, estado: boolean): Promise<void> {
    const { error } = await supabase
      .from('tb_gerencias')
      .update({ estado })
      .eq('id_gerencia', idGerencia);
    if (error) throw error;
  }
};

// ============================================
// EQUIPOS
// ============================================
export const equiposService = {
  // Obtener todos los equipos ACTIVOS (para selección)
  async getAll(): Promise<Equipo[]> {
    const { data, error } = await supabase
      .from('tb_equipos')
      .select('*')
      .eq('estado', 1)
      .order('id_equipo', { ascending: true });

    if (error) {
      console.error('Error al cargar equipos desde Supabase:', error);
      throw error;
    }
    return data || [];
  },

  // Obtener TODOS los equipos (incluye inactivos) - uso administrativo
  async getAllAdmin(): Promise<Equipo[]> {
    const { data, error } = await supabase
      .from('tb_equipos')
      .select('*')
      .order('id_equipo', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Obtener equipos por gerencia (solo activos)
  async getByGerencia(idGerencia: number): Promise<Equipo[]> {
    const { data, error } = await supabase
      .from('tb_equipos')
      .select('*')
      .eq('id_gerencia', idGerencia)
      .eq('estado', 1)
      .order('id_equipo', { ascending: true });

    if (error) {
      console.error('Error al cargar equipos por gerencia:', error);
      throw error;
    }
    return data || [];
  },

  // Cambiar estado (activar/desactivar)
  async updateEstado(idEquipo: number, estado: boolean | number): Promise<void> {
    const { error } = await supabase
      .from('tb_equipos')
      .update({ estado })
      .eq('id_equipo', idEquipo);
    if (error) throw error;
  }
};

// ============================================
// TIPOS DE ENTREGABLES
// ============================================
export const tiposEntregablesService = {
  // Obtener tipos de entregables ACTIVOS (para selección)
  async getAll(): Promise<TipoEntregable[]> {
    const { data, error } = await supabase
      .from('entregables')
      .select('*')
      .eq('estado', true)
      .order('id_entregable', { ascending: true });

    if (error) {
      console.error('Error al cargar tipos de entregables:', error);
      throw error;
    }
    return data || [];
  },
  // Obtener TODOS los tipos de entregables (incluye inactivos) - uso administrativo
  async getAllAdmin(): Promise<TipoEntregable[]> {
    const { data, error } = await supabase
      .from('entregables')
      .select('*')
      .order('id_entregable', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  // Cambiar estado (activar/desactivar)
  async updateEstado(idEntregable: number, estado: boolean): Promise<void> {
    const { error } = await supabase
      .from('entregables')
      .update({ estado })
      .eq('id_entregable', idEntregable);
    if (error) throw error;
  }
};

// ============================================
// CATEGORÍAS
// ============================================
export const categoriasService = {
  async getAll(): Promise<Categoria[]> {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id_categoria: row.id_categoria ?? row.id ?? row.idcategoria ?? 1,
      nombre: (row.nombre ?? row.nombre_categoria ?? row.nombre_categorias ?? '').toString()
    }));
  }
};

// ============================================
// ENTREGABLES (ARCHIVOS)
// ============================================
export const entregablesService = {
  // Subir un archivo
  async upload(file: File, idActividad: number, idUsuario: number): Promise<Entregable> {
    try {
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const nombreBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const nombreArchivo = `${idActividad}_${timestamp}_${nombreBase}.${extension}`;
      const rutaArchivo = `entregables/${idActividad}/${nombreArchivo}`;

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('archivos-actividades')
        .upload(rutaArchivo, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Registrar en la base de datos
      const { data: entregable, error: dbError } = await supabase
        .from('tb_entregables')
        .insert([{
          id_actividad: idActividad,
          nombre_archivo: file.name,
          ruta_archivo: rutaArchivo,
          subido_por: idUsuario,
          tamaño_archivo: file.size
        }])
        .select()
        .single();

      if (dbError) {
        // Si falla el registro en BD, eliminar el archivo subido
        await supabase.storage.from('archivos-actividades').remove([rutaArchivo]);
        throw dbError;
      }

      return entregable;
    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      throw new Error('Error al subir archivo: ' + error.message);
    }
  },

  // Obtener entregables de una actividad
  async getByActividad(idActividad: number): Promise<Entregable[]> {
    const { data, error } = await supabase
      .from('tb_entregables')
      .select('*')
      .eq('id_actividad', idActividad)
      .order('fecha_subida', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Descargar un archivo
  async download(rutaArchivo: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('archivos-actividades')
      .download(rutaArchivo);

    if (error) throw error;
    if (!data) throw new Error('No se pudo descargar el archivo');
    return data;
  },

  // Obtener URL pública del archivo
  getPublicUrl(rutaArchivo: string): string {
    const { data } = supabase.storage
      .from('archivos-actividades')
      .getPublicUrl(rutaArchivo);
    
    return data.publicUrl;
  },

  // Eliminar un entregable
  async delete(id: number, rutaArchivo: string): Promise<void> {
    // Eliminar de storage
    const { error: storageError } = await supabase.storage
      .from('archivos-actividades')
      .remove([rutaArchivo]);

    if (storageError) throw storageError;

    // Eliminar de base de datos
    const { error: dbError } = await supabase
      .from('tb_entregables')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
  }
};

// ============================================
// SISTEMAS
// ============================================
export const sistemasService = {
  // Obtener todos los sistemas ACTIVOS (para vistas y selecciones)
  async getAll(): Promise<Sistema[]> {
    const { data: sistemasRaw, error } = await supabase
      .from('tb_sistemas')
      .select('*')
      .eq('estado', 1)
      .order('id', { ascending: true });

    if (error) throw error;

    // Obtener admin asignado por sistema (si existe) y traer su nombre completo
    const { data: asignaciones } = await supabase
      .from('tb_admin_sistemas')
      .select('id_sistema, id_admin');
    const adminBySistema = new Map((asignaciones || []).map((a: any) => [a.id_sistema, a.id_admin]));
    const adminIds = Array.from(new Set((asignaciones || []).map((a: any) => a.id_admin)));
    let usuariosMap = new Map<number, any>();
    if (adminIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('tb_usuarios')
        .select('id_usuario, nombre, apellido')
        .in('id_usuario', adminIds);
      usuariosMap = new Map((usuarios || []).map((u: any) => [u.id_usuario, `${u.nombre} ${u.apellido}`]));
    }

    return (sistemasRaw || []).map((s: any) => {
      const adminId = adminBySistema.get(s.id);
      const adminNombre = adminId ? (usuariosMap.get(adminId) || s.administrador || '') : (s.administrador || '');
      return { ...s, administrador: adminNombre } as Sistema;
    });
  },

  // Obtener TODOS los sistemas (incluye inactivos) - uso administrativo
  async getAllAdmin(): Promise<Sistema[]> {
    const { data: sistemasRaw, error } = await supabase
      .from('tb_sistemas')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (sistemasRaw || []) as any;
  },

  // Crear un sistema
  async create(sistema: Omit<Sistema, 'id'>): Promise<Sistema> {
    const { data, error } = await supabase
      .from('tb_sistemas')
      .insert([sistema])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar un sistema
  async update(id: number, sistema: Partial<Sistema>): Promise<Sistema> {
    const { data, error } = await supabase
      .from('tb_sistemas')
      .update(sistema)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar un sistema
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('tb_sistemas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// ACTIVIDADES
// ============================================
export const actividadesService = {
  // Obtener todas las actividades con información del sistema y equipo
  async getAll(): Promise<ActividadConSistema[]> {
    // Primero obtener todas las actividades simples
    const { data: actividadesData, error: actError } = await supabase
      .from('tb_actividades')
      .select('*')
      .order('id_actividad', { ascending: true });

    if (actError) throw actError;

    // Obtener relaciones (sistema y equipo por actividad)
    const { data: relacionesData, error: relError } = await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo');

    if (relError) throw relError;

    // Obtener sistemas
    const { data: sistemasData, error: sisError } = await supabase
      .from('tb_sistemas')
      .select('id, abrev');

    if (sisError) throw sisError;

    // Obtener equipos
    const { data: equiposData, error: eqError } = await supabase
      .from('tb_equipos')
      .select('id_equipo, desc_equipo');

    if (eqError) throw eqError;

    // Crear mapas para búsqueda rápida
    const sistemasMap = new Map(
      (sistemasData || []).map(sis => [sis.id, sis.abrev])
    );
    const equiposMap = new Map(
      (equiposData || []).map(eq => [eq.id_equipo, eq.desc_equipo])
    );
    const relacionesMap = new Map<number, any>();
    (relacionesData || []).forEach(rel => {
      if (!relacionesMap.has(rel.id_actividad)) {
        relacionesMap.set(rel.id_actividad, rel);
      }
    });

    // Transformar datos
    return (actividadesData || []).map((actividad: any) => {
      const relacion = relacionesMap.get(actividad.id_actividad);
      const sistemaAbrev = relacion ? (sistemasMap.get(relacion.id_sistema) || 'N/A') : 'N/A';
      const equipoNombre = relacion?.id_equipo ? (equiposMap.get(relacion.id_equipo) || 'N/A') : 'N/A';
      
      return {
        ...actividad,
        sistema_abrev: sistemaAbrev,
        equipo_nombre: equipoNombre,
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia
      };
    });
  },

  // Obtener actividades filtradas por sistema
  async getBySystem(sistemaId: number): Promise<ActividadConSistema[]> {
    // Obtener IDs de actividades del sistema
    const { data: relacionesData, error: relError } = await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_equipo')
      .eq('id_sistema', sistemaId);

    if (relError) throw relError;

    const actividadIds = (relacionesData || []).map(r => r.id_actividad);
    
    if (actividadIds.length === 0) {
      return [];
    }

    // Obtener actividades
    const { data: actividadesData, error: actError } = await supabase
      .from('tb_actividades')
      .select('*')
      .in('id_actividad', actividadIds)
      .order('id_actividad', { ascending: true });

    if (actError) throw actError;

    // Obtener sistemas y equipos
    const { data: sistemasData } = await supabase.from('tb_sistemas').select('id, abrev');
    const { data: equiposData } = await supabase.from('tb_equipos').select('id_equipo, desc_equipo');

    const sistemasMap = new Map((sistemasData || []).map(s => [s.id, s.abrev]));
    const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
    const relacionesMap = new Map((relacionesData || []).map(r => [r.id_actividad, r]));

    return (actividadesData || []).map((actividad: any) => {
      const relacion = relacionesMap.get(actividad.id_actividad);
      return {
        ...actividad,
        sistema_abrev: sistemasMap.get(sistemaId) || 'N/A',
        equipo_nombre: relacion?.id_equipo ? (equiposMap.get(relacion.id_equipo) || 'N/A') : 'N/A',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia
      };
    });
  },

  // Obtener actividades filtradas por trimestre
  async getByTrimestre(trimestre: number): Promise<ActividadConSistema[]> {
    const { data: actividadesData, error: actError } = await supabase
      .from('tb_actividades')
      .select('*')
      .eq('trimestre', trimestre)
      .order('id_actividad', { ascending: true });

    if (actError) throw actError;

    const actividadIds = (actividadesData || []).map(a => a.id_actividad);
    
    if (actividadIds.length === 0) {
      return [];
    }

    // Obtener relaciones
    const { data: relacionesData } = await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo')
      .in('id_actividad', actividadIds);

    // Obtener sistemas y equipos
    const { data: sistemasData } = await supabase.from('tb_sistemas').select('id, abrev');
    const { data: equiposData } = await supabase.from('tb_equipos').select('id_equipo, desc_equipo');

    const sistemasMap = new Map((sistemasData || []).map(s => [s.id, s.abrev]));
    const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
    const relacionesMap = new Map<number, any>();
    (relacionesData || []).forEach(rel => {
      if (!relacionesMap.has(rel.id_actividad)) {
        relacionesMap.set(rel.id_actividad, rel);
      }
    });

    return (actividadesData || []).map((actividad: any) => {
      const relacion = relacionesMap.get(actividad.id_actividad);
      return {
        ...actividad,
        sistema_abrev: relacion ? (sistemasMap.get(relacion.id_sistema) || 'N/A') : 'N/A',
        equipo_nombre: relacion?.id_equipo ? (equiposMap.get(relacion.id_equipo) || 'N/A') : 'N/A',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia
      };
    });
  },

  // Crear una nueva actividad
  async create(actividad: {
    nombre_actividad: string;
    id_sistema: number;
    trimestre: number;
    trimestres?: number[]; // Array de trimestres seleccionados
    estado_actividad: 'pendiente' | 'reprogramado' | 'completado';
    fecha_sustento?: string;
    evaluacion: 'conforme' | 'pendiente' | 'no conforme';
    cod_cat_int?: number;
    id_gerencia?: number;
    id_equipo?: number;
    id_entregable?: number;
  }): Promise<Actividad> {
    // Primero crear la actividad
    const { data: nuevaActividad, error: errorActividad } = await supabase
      .from('tb_actividades')
      .insert([{
        nombre_actividad: actividad.nombre_actividad,
        trimestre: actividad.trimestre,
        trimestres: actividad.trimestres || [actividad.trimestre],
        estado_actividad: actividad.estado_actividad,
        fecha_sustento: actividad.fecha_sustento,
        evaluacion: actividad.evaluacion,
        cod_cat_int: actividad.cod_cat_int || 1,
        id_entregable: actividad.id_entregable,
        estado: true
      }])
      .select();

    if (errorActividad) throw errorActividad;
    
    // Manejar el caso de múltiples filas devueltas
    const actividadCreada = Array.isArray(nuevaActividad) ? nuevaActividad[0] : nuevaActividad;
    
    if (!actividadCreada) {
      throw new Error('No se pudo crear la actividad');
    }

    // Verificar si ya existe una relación (prevenir duplicados)
    const { data: relacionExistente } = await supabase
      .from('tb_as_sis_act')
      .select('id')
      .eq('id_actividad', actividadCreada.id_actividad)
      .eq('id_sistema', actividad.id_sistema)
      .eq('id_equipo', actividad.id_equipo || 1)
      .maybeSingle();

    // Solo insertar si no existe la relación
    if (!relacionExistente) {
      const relacionData: any = {
        id_actividad: actividadCreada.id_actividad,
        id_sistema: actividad.id_sistema,
        cod_cat_int: actividad.cod_cat_int || 1,
        id_gerencia: actividad.id_gerencia || 1, // Default a GENERAL (id=1)
        id_equipo: actividad.id_equipo || 1 // Default al primer equipo
      };
      
      console.log('Insertando relación con datos:', relacionData);
      
      const { error: errorRelacion } = await supabase
        .from('tb_as_sis_act')
        .insert([relacionData]);

      if (errorRelacion) {
        console.error('Error al crear relación:', errorRelacion);
        // Si falla la relación, eliminar la actividad creada
        await supabase.from('tb_actividades').delete().eq('id_actividad', actividadCreada.id_actividad);
        throw errorRelacion;
      }
    } else {
      console.log('La relación ya existe, no se insertará duplicado');
    }

    return actividadCreada;
  },

  // Actualizar una actividad
  async update(id: number, actividad: Partial<Actividad>): Promise<Actividad> {
    const { data, error } = await supabase
      .from('tb_actividades')
      .update(actividad)
      .eq('id_actividad', id)
      .select();

    if (error) {
      console.error('Error al actualizar actividad:', error);
      throw error;
    }
    
    // Manejar el caso de múltiples filas devueltas
    if (!data || data.length === 0) {
      throw new Error('No se encontró la actividad a actualizar');
    }
    
    // Si hay múltiples registros (duplicados), retornar el primero
    const actividadActualizada = Array.isArray(data) ? data[0] : data;
    
    if (data.length > 1) {
      console.warn(`ADVERTENCIA: Se encontraron ${data.length} actividades con id=${id}. Esto indica duplicados en la base de datos.`);
    }
    
    return actividadActualizada;
  },

  // Actualizar relación de actividad con sistema y equipo (o crearla si no existe)
  async updateRelacion(id_actividad: number, datos: {
    id_sistema?: number;
    id_equipo?: number;
    id_gerencia?: number;
  }): Promise<void> {
    console.log('updateRelacion - Buscando relación para actividad:', id_actividad);
    
    // Primero obtener la actividad para conseguir su cod_cat_int
    const { data: actividadData, error: errorActividad } = await supabase
      .from('tb_actividades')
      .select('cod_cat_int')
      .eq('id_actividad', id_actividad)
      .single();

    if (errorActividad || !actividadData) {
      console.error('Error al obtener actividad:', errorActividad);
      throw new Error(`No se encontró la actividad ${id_actividad}`);
    }

    const cod_cat_int = actividadData.cod_cat_int || 1;
    console.log('cod_cat_int de la actividad:', cod_cat_int);
    
    // Obtener todas las relaciones de esta actividad
    const { data: relacionesData, error: errorBuscar } = await supabase
      .from('tb_as_sis_act')
      .select('*')
      .eq('id_actividad', id_actividad);

    if (errorBuscar) {
      console.error('Error al buscar relación:', errorBuscar);
      throw errorBuscar;
    }

    // Si NO existe relación, crearla
    if (!relacionesData || relacionesData.length === 0) {
      console.warn(`No existe relación para la actividad ${id_actividad}. Creando nueva relación...`);
      
      if (!datos.id_sistema || !datos.id_equipo) {
        throw new Error(`Para crear una relación se requiere id_sistema e id_equipo`);
      }

      // Obtener el id_gerencia correcto del equipo
      const { data: equipoData, error: errorEquipo } = await supabase
        .from('tb_equipos')
        .select('id_gerencia')
        .eq('id_equipo', datos.id_equipo)
        .single();

      if (errorEquipo || !equipoData) {
        console.error('Error al obtener equipo:', errorEquipo);
        throw new Error(`No se encontró el equipo ${datos.id_equipo}`);
      }

      const id_gerencia_correcto = equipoData.id_gerencia;
      console.log('id_gerencia del equipo:', id_gerencia_correcto);

      const { data: nuevaRelacion, error: errorCrear } = await supabase
        .from('tb_as_sis_act')
        .insert([{
          id_actividad: id_actividad,
          id_sistema: datos.id_sistema,
          id_equipo: datos.id_equipo,
          id_gerencia: id_gerencia_correcto,
          cod_cat_int: cod_cat_int
        }])
        .select();

      if (errorCrear) {
        console.error('Error al crear relación:', errorCrear);
        throw errorCrear;
      }

      console.log('Relación creada exitosamente:', nuevaRelacion);
      return;
    }

    // Si hay múltiples relaciones (duplicados), advertir
    if (relacionesData.length > 1) {
      console.warn(`ADVERTENCIA: Se encontraron ${relacionesData.length} relaciones para la actividad ${id_actividad}`);
    }

    const relacionExistente = relacionesData[0];
    console.log('Relación encontrada:', relacionExistente);

    // Si se está cambiando el equipo, obtener su id_gerencia correcto
    let id_gerencia_final = relacionExistente.id_gerencia;
    
    if (datos.id_equipo && datos.id_equipo !== relacionExistente.id_equipo) {
      const { data: equipoData, error: errorEquipo } = await supabase
        .from('tb_equipos')
        .select('id_gerencia')
        .eq('id_equipo', datos.id_equipo)
        .single();

      if (errorEquipo || !equipoData) {
        console.error('Error al obtener equipo:', errorEquipo);
        throw new Error(`No se encontró el equipo ${datos.id_equipo}`);
      }

      id_gerencia_final = equipoData.id_gerencia;
      console.log('Nuevo id_gerencia del equipo:', id_gerencia_final);
    }

    // Preparar datos a actualizar
    const datosActualizar = {
      id_sistema: datos.id_sistema !== undefined ? datos.id_sistema : relacionExistente.id_sistema,
      id_equipo: datos.id_equipo !== undefined ? datos.id_equipo : relacionExistente.id_equipo,
      id_gerencia: id_gerencia_final
    };

    console.log('Actualizando relación con datos:', datosActualizar);

    // Actualizar TODAS las relaciones de esta actividad (en caso de duplicados)
    const { data: resultado, error: errorActualizar } = await supabase
      .from('tb_as_sis_act')
      .update(datosActualizar)
      .eq('id_actividad', id_actividad)
      .select();

    if (errorActualizar) {
      console.error('Error al actualizar relación:', errorActualizar);
      throw errorActualizar;
    }

    console.log('Relación actualizada correctamente:', resultado);
    console.log(`Se actualizaron ${resultado?.length || 0} registros en tb_as_sis_act`);
  },

  // Eliminar una actividad
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('tb_actividades')
      .delete()
      .eq('id_actividad', id);

    if (error) throw error;
  },

  // Eliminar actividad + relaciones (usuario_actividades, admin_actividades, as_sis_act, entregables)
  async deleteWithRelations(idActividad: number): Promise<void> {
    // Eliminar entregables asociados (solo registros BD)
    await supabase.from('tb_entregables').delete().eq('id_actividad', idActividad);
    // Eliminar asignaciones de usuarios
    await supabase.from('tb_usuario_actividades').delete().eq('id_actividad', idActividad);
    // Eliminar relación admin-actividad
    await supabase.from('tb_admin_actividades').delete().eq('id_actividad', idActividad);
    // Eliminar relación sistema-actividad-equipo
    await supabase.from('tb_as_sis_act').delete().eq('id_actividad', idActividad);
    // Finalmente, eliminar actividad
    const { error } = await supabase.from('tb_actividades').delete().eq('id_actividad', idActividad);
    if (error) throw error;
  },

  // Obtener actividades por IDs (raw)
  async getByIds(ids: number[]): Promise<any[]> {
    const { data, error } = await supabase
      .from('tb_actividades')
      .select('*')
      .in('id_actividad', ids);
    if (error) throw error;
    return data || [];
  }
};

// ============================================
// AUTENTICACIÓN
// ============================================
export const authService = {
  // Login con Supabase Auth
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

// ============================================
// USUARIOS Y ROLES
// ============================================
// URL del backend Spring Boot
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// ============================================
// NOTIFICACIONES POR EMAIL
// ============================================
export const notificacionesService = {
  // Enviar notificación de actividad asignada
  async enviarNotificacionActividad(
    email: string,
    nombreUsuario: string,
    nombreActividad: string,
    sistemaAbrev: string,
    equipoNombre: string,
    trimestre: number,
    fechaMaxima: string | null
  ): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notificaciones/actividad-asignada`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          nombreUsuario,
          nombreActividad,
          sistemaAbrev,
          equipoNombre,
          trimestre,
          fechaMaxima: fechaMaxima || 'No especificada'
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar notificación por email');
      }

      console.log('✅ Notificación enviada exitosamente');
    } catch (error: any) {
      console.error('❌ Error al enviar notificación:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  },

  // Usuario marcó 'Cumplió' -> notificar admin
  async enviarUsuarioCumplio(payload: {
    adminEmail: string;
    usuarioNombre: string;
    usuarioEmail: string;
    nombreActividad: string;
    entregableNombre?: string | null;
    sistemaAbrev?: string | null;
    equipoNombre?: string | null;
    fechaMaxima?: string | null;
  }): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/notificaciones/usuario-cumplio`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Error al notificar cumplimiento');
    }
  },

  // Admin marcó 'Conforme' -> notificar usuario(s) y superadmin(es)
  async enviarConforme(payload: {
    usuariosDestino: string[];
    superadminsDestino: string[];
    nombreActividad: string;
    entregableNombre?: string | null;
    sistemaAbrev?: string | null;
    equipoNombre?: string | null;
    fechaMaxima?: string | null;
  }): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/notificaciones/conforme`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Error al notificar conforme');
    }
  },

  // Nuevo: Usuario creado con equipo/gerencia
  async createUsuarioBackend(payload: {
    email: string;
    nombreUsuario: string;
    contrasena: string;
    gerenciaNombre: string;
    equipoNombre: string;
  }): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/notificaciones/usuario-creado`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Error al enviar notificación de usuario creado');
    }
  },

  // Nuevo: Asignación de sistema a admin
  async enviarAsignacionSistema(payload: {
    email: string;
    nombreAdmin: string;
    sistemaAbrev: string;
    sistemaNombre: string;
  }): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/notificaciones/asignacion-sistema`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Error al enviar notificación de asignación de sistema');
    }
  }
};

export const usuariosService = {
  // Crear administrador (vía backend: envía credenciales por email y asigna sistema)
  async createAdminBackend(admin: {
    nombre: string;
    apellido: string;
    email: string;
    contrasena: string;
    idSistema: number;
  }): Promise<Usuario> {
    const response = await fetch(`${BACKEND_URL}/api/usuarios/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin)
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Error al crear administrador');
    }
    // Intentar parsear JSON; si no hay cuerpo, retornar el usuario por correo como fallback
    try {
      return await response.json();
    } catch {
      const fallback = await usuariosService.getByEmail(admin.email);
      if (fallback) return fallback as any;
      throw new Error('Administrador creado pero no se pudo recuperar la respuesta');
    }
  },

  // Crear usuario (vía backend: genera contraseña y envía credenciales por email)
  async createUsuarioBackend(payload: {
    nombre: string;
    apellido: string;
    email: string;
  }): Promise<Usuario & { contrasena?: string }> {
    const response = await fetch(`${BACKEND_URL}/api/usuarios/usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Error al crear usuario');
    }
    // Algunos backends devuelven 201 sin body o texto; ser tolerantes
    try {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return await response.json();
      }
      // Si no es JSON, intentar leer texto y luego buscar el usuario por email
    } catch {}
    const fallback = await usuariosService.getByEmail(payload.email);
    if (fallback) return fallback as any;
    // Último intento: no romper el flujo
    return { id_usuario: 0, nombre: payload.nombre, apellido: payload.apellido, email: payload.email, rol: 'usuario', estado: true } as any;
  },
  
  // Crear usuario con actividad (backend envía credenciales + detalle de actividad)
  async createUsuarioConActividad(payload: {
    nombre: string;
    apellido: string;
    email: string;
    nombreActividad: string;
    sistemaAbrev: string;
    equipoNombre: string;
    trimestre: number;
    fechaMaxima: string | null;
  }): Promise<Usuario & { contrasena?: string }> {
    const response = await fetch(`${BACKEND_URL}/api/usuarios/usuario-con-actividad`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Error al crear usuario con actividad');
    }
    return response.json();
  },
  
  // Mantener compatibilidad con funciones antiguas (deprecated)
  // createAdmin y createUser directos a Supabase (sin email automático)
  async createAdmin(admin: {
    nombre: string;
    apellido: string;
    email: string;
    contrasena: string;
    idSistema: number;
  }): Promise<Usuario> {
    try {
      const { data: nuevoAdmin, error: errorUsuario } = await supabase
        .from('tb_usuarios')
        .insert([
          {
            nombre: admin.nombre,
            apellido: admin.apellido,
            email: admin.email,
            contrasena: admin.contrasena,
            rol: 'admin',
            estado: true,
          },
        ])
        .select()
        .single();
      if (errorUsuario) throw errorUsuario;

      const { error: errorAsignacion } = await supabase
        .from('tb_admin_sistemas')
        .insert([{ id_admin: nuevoAdmin.id_usuario, id_sistema: admin.idSistema }]);
      if (errorAsignacion) {
        await supabase.from('tb_usuarios').delete().eq('id_usuario', nuevoAdmin.id_usuario);
        throw errorAsignacion;
      }
      return nuevoAdmin;
    } catch (error: any) {
      throw new Error('Error al crear administrador: ' + error.message);
    }
  },

  async createUser(usuario: {
    nombre: string;
    apellido: string;
    email: string;
    contrasena: string;
    idActividad: number;
  }): Promise<Usuario> {
    try {
      const { data: nuevoUsuario, error: errorUsuario } = await supabase
        .from('tb_usuarios')
        .insert([
          {
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            contrasena: usuario.contrasena,
            rol: 'usuario',
            estado: true,
          },
        ])
        .select()
        .single();
      if (errorUsuario) throw errorUsuario;
      return nuevoUsuario;
    } catch (error: any) {
      throw new Error('Error al crear usuario: ' + error.message);
    }
  },
  
  // Validar credenciales
  async validateCredenciales(email: string, contrasena: string): Promise<Usuario | null> {
    try {
      const { data, error } = await supabase
        .from('tb_usuarios')
        .select('*')
        .eq('email', email)
        .eq('contrasena', contrasena)
        .eq('estado', true)
        .maybeSingle();

      if (error) {
        console.error('Error al validar credenciales:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error al validar credenciales:', error);
      return null;
    }
  },

  // Obtener usuario por email
  async getByEmail(email: string): Promise<Usuario | null> {
    const response = await fetch(`${BACKEND_URL}/api/usuarios/${encodeURIComponent(email)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Error al obtener usuario');
    }

    return response.json();
  },

  // Obtener todos los administradores
  async getAdmins(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('tb_usuarios')
      .select('*')
      .eq('rol', 'admin')
      .eq('estado', true)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener todos los usuarios (rol usuario)
  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('tb_usuarios')
      .select('*')
      .eq('rol', 'usuario')
      .eq('estado', true)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// ============================================
// USUARIO ↔ EQUIPO (relación global)
// ============================================
export const usuariosEquiposService = {
  // Vincular un usuario a una gerencia y equipo (único por usuario)
  async assign(idUsuario: number, idGerencia: number, idEquipo: number): Promise<{ id: number; id_usuario: number; id_gerencia: number; id_equipo: number }>{
    const { data, error } = await supabase
      .from('tb_usuario_equipo')
      .upsert([
        { id_usuario: idUsuario, id_gerencia: idGerencia, id_equipo: idEquipo }
      ], { onConflict: 'id_usuario' })
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  // Obtener mapeo de un usuario
  async getByUsuario(idUsuario: number): Promise<{ id_usuario: number; id_gerencia: number | null; id_equipo: number | null } | null> {
    const { data, error } = await supabase
      .from('tb_usuario_equipo')
      .select('id_usuario, id_gerencia, id_equipo')
      .eq('id_usuario', idUsuario)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  // Obtener usuarios (rol usuario) por equipo
  async getUsuariosByEquipo(idEquipo: number): Promise<Usuario[]> {
    // obtener ids de usuarios desde la tabla de mapeo
    const { data: mapeos, error: errM } = await supabase
      .from('tb_usuario_equipo')
      .select('id_usuario')
      .eq('id_equipo', idEquipo);
    if (errM) throw errM;
    const ids = Array.from(new Set((mapeos || []).map((m: any) => m.id_usuario)));
    if (ids.length === 0) return [];
    const { data: usuarios, error: errU } = await supabase
      .from('tb_usuarios')
      .select('*')
      .in('id_usuario', ids)
      .eq('rol', 'usuario')
      .eq('estado', true);
    if (errU) throw errU;
    return usuarios || [];
  },

  // Obtener mapeo de usuario→equipo para todos los usuarios de rol 'usuario'
  async getUsuariosConEquipo(): Promise<Array<Usuario & { id_gerencia?: number | null; id_equipo?: number | null }>> {
    const { data: usuarios, error: errU } = await supabase
      .from('tb_usuarios')
      .select('*')
      .eq('rol', 'usuario')
      .eq('estado', true);
    if (errU) throw errU;

    const ids = (usuarios || []).map(u => u.id_usuario);
    if (ids.length === 0) return usuarios || [];

    const { data: mapeos, error: errM } = await supabase
      .from('tb_usuario_equipo')
      .select('id_usuario, id_gerencia, id_equipo')
      .in('id_usuario', ids);
    if (errM) throw errM;

    const map = new Map((mapeos || []).map((m: any) => [m.id_usuario, m]));
    return (usuarios || []).map((u: any) => ({
      ...u,
      id_gerencia: map.get(u.id_usuario)?.id_gerencia ?? null,
      id_equipo: map.get(u.id_usuario)?.id_equipo ?? null,
    }));
  },
};

// ============================================
// ASIGNACIÓN DE SISTEMAS A ADMINISTRADORES
// ============================================
export const adminSistemasService = {
  // Asignar sistema a administrador
  async assign(idAdmin: number, idSistema: number): Promise<AdminSistema> {
    const { data, error } = await supabase
      .from('tb_admin_sistemas')
      .insert([{
        id_admin: idAdmin,
        id_sistema: idSistema
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener sistemas asignados a un administrador
  async getSistemasByAdmin(idAdmin: number): Promise<Sistema[]> {
    try {
      // Obtener los IDs de sistemas asignados al admin
      const { data: asignaciones, error: errorAsig } = await supabase
        .from('tb_admin_sistemas')
        .select('id_sistema')
        .eq('id_admin', idAdmin);

      if (errorAsig) throw errorAsig;

      if (!asignaciones || asignaciones.length === 0) {
        return [];
      }

      const sistemaIds = asignaciones.map(a => a.id_sistema);

      // Obtener los datos completos de los sistemas (solo activos)
      const { data: sistemas, error: errorSistemas } = await supabase
        .from('tb_sistemas')
        .select('*')
        .in('id', sistemaIds)
        .eq('estado', 1)
        .order('id', { ascending: true });

      if (errorSistemas) throw errorSistemas;

      return sistemas || [];
    } catch (error: any) {
      console.error('Error al obtener sistemas del administrador:', error);
      throw new Error('Error al obtener sistemas del administrador: ' + error.message);
    }
  },

  
  // Verificar si un sistema ya tiene administrador asignado
  async getSistemaAdmin(idSistema: number): Promise<Usuario | null> {
    const { data: asignacion, error: errorAsig } = await supabase
      .from('tb_admin_sistemas')
      .select('id_admin')
      .eq('id_sistema', idSistema)
      .maybeSingle();

    if (errorAsig) throw errorAsig;
    if (!asignacion) return null;

    const { data: admin, error: errorAdmin } = await supabase
      .from('tb_usuarios')
      .select('*')
      .eq('id_usuario', asignacion.id_admin)
      .single();

    if (errorAdmin) throw errorAdmin;
    return admin;
  },

  // Desasignar sistema de administrador
  async unassign(idAdmin: number, idSistema: number): Promise<void> {
    const { error } = await supabase
      .from('tb_admin_sistemas')
      .delete()
      .eq('id_admin', idAdmin)
      .eq('id_sistema', idSistema);

    if (error) throw error;
  }
};

// ============================================
// REFERENCIAS A ACTIVIDADES (para validaciones de desactivación)
// ============================================
export const referenciasService = {
  async equipoTieneActividades(idEquipo: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('tb_as_sis_act')
      .select('id', { count: 'exact', head: true })
      .eq('id_equipo', idEquipo);
    if (error) throw error;
    // Si la librería no devuelve count con head: true, realizar fallback simple
    if ((data as any) === null) {
      const { data: rows } = await supabase
        .from('tb_as_sis_act')
        .select('id')
        .eq('id_equipo', idEquipo)
        .limit(1);
      return !!(rows && rows.length > 0);
    }
    // count no está en data; sin head tendríamos que implementar distinto. Consideramos fallback ya cubierto.
    return true; // con head, si no hay error asumimos existencia; el fallback cubre caso real.
  },
  async gerenciaTieneActividades(idGerencia: number): Promise<boolean> {
    const { data } = await supabase
      .from('tb_as_sis_act')
      .select('id')
      .eq('id_gerencia', idGerencia)
      .limit(1);
    return !!(data && data.length > 0);
  },
  async entregableTieneActividades(idEntregable: number): Promise<boolean> {
    const { data } = await supabase
      .from('tb_actividades')
      .select('id_actividad')
      .eq('id_entregable', idEntregable)
      .limit(1);
    return !!(data && data.length > 0);
  }
};

// ============================================
// ASIGNACIÓN DE ACTIVIDADES A USUARIOS
// ============================================
export const usuarioActividadesService = {
  // Asignar actividad a usuario
  async assign(idUsuario: number, idActividad: number): Promise<UsuarioActividad> {
    const { data, error } = await supabase
      .from('tb_usuario_actividades')
      .insert([{
        id_usuario: idUsuario,
        id_actividad: idActividad,
        cumplimiento: 'pendiente'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener actividades asignadas a un usuario
  async getActividadesByUsuario(idUsuario: number): Promise<ActividadConSistema[]> {
    const { data: asignaciones, error: errorAsig } = await supabase
      .from('tb_usuario_actividades')
      .select('id_actividad, cumplimiento')
      .eq('id_usuario', idUsuario);

    if (errorAsig) throw errorAsig;

    const actividadIds = (asignaciones || []).map(a => a.id_actividad);
    
    if (actividadIds.length === 0) {
      return [];
    }

    // Obtener actividades
    const { data: actividadesData, error: actError } = await supabase
      .from('tb_actividades')
      .select('*')
      .in('id_actividad', actividadIds)
      .order('id_actividad', { ascending: true });

    if (actError) throw actError;

    // Obtener relaciones, sistemas, equipos, gerencias y entregables
    const { data: relacionesData } = await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo, id_gerencia')
      .in('id_actividad', actividadIds);

    const { data: sistemasData } = await supabase.from('tb_sistemas').select('id, abrev');
    const { data: equiposData } = await supabase.from('tb_equipos').select('id_equipo, desc_equipo');
    const { data: gerenciasData } = await supabase.from('tb_gerencias').select('id_gerencia, des_gerencia, abrev');
    const { data: entregablesData } = await supabase.from('entregables').select('id_entregable, nombre_entregables');

    const sistemasMap = new Map((sistemasData || []).map(s => [s.id, s.abrev]));
    const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
    const gerenciasNombreMap = new Map((gerenciasData || []).map(g => [g.id_gerencia, g.des_gerencia]));
    const gerenciasAbrevMap = new Map((gerenciasData || []).map((g: any) => [g.id_gerencia, g.abrev]));
    const entregablesMap = new Map((entregablesData || []).map((e: any) => [e.id_entregable, e.nombre_entregables]));
    const relacionesMap = new Map<number, any>();
    (relacionesData || []).forEach(rel => {
      if (!relacionesMap.has(rel.id_actividad)) {
        relacionesMap.set(rel.id_actividad, rel);
      }
    });
    
    const cumplimientoMap = new Map((asignaciones || []).map(a => [a.id_actividad, a.cumplimiento]));

    // Obtener cumplimiento de TODOS los usuarios para marcar en_revision si alguien marcó 'cumple'
    const { data: cumplAll } = await supabase
      .from('tb_usuario_actividades')
      .select('id_actividad, cumplimiento')
      .in('id_actividad', actividadIds);
    const enRevisionSet = new Set<number>();
    (cumplAll || []).forEach((c: any) => { if (c.cumplimiento === 'cumple') enRevisionSet.add(c.id_actividad); });

    // Para mostrar todos los entregables del "grupo" (misma actividad + misma relación),
    // obtenemos otras actividades con igual nombre y luego filtramos por la misma relación.
    const nombresUnicos = Array.from(new Set((actividadesData || []).map((a: any) => a.nombre_actividad).filter(Boolean)));
    let otrasActividadesMismoNombre: any[] = [];
    if (nombresUnicos.length > 0) {
      const { data: actsMismoNombre } = await supabase
        .from('tb_actividades')
        .select('*')
        .in('nombre_actividad', nombresUnicos);
      otrasActividadesMismoNombre = actsMismoNombre || [];
    }
    const idsActsMismoNombre = (otrasActividadesMismoNombre || []).map((a: any) => a.id_actividad);
    const { data: relActsMismoNombre } = idsActsMismoNombre.length > 0 ? await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo, id_gerencia')
      .in('id_actividad', idsActsMismoNombre) : { data: [] as any[] } as any;
    const relMismoNombreMap = new Map<number, any>();
    (relActsMismoNombre || []).forEach((r: any) => relMismoNombreMap.set(r.id_actividad, r));

    return (actividadesData || []).map((actividad: any) => {
      const relacion = relacionesMap.get(actividad.id_actividad);
      // Buscar hermanos con mismo nombre y misma relación (sistema, equipo, gerencia)
      const hermanos = (otrasActividadesMismoNombre || []).filter((a: any) => {
        if (a.nombre_actividad !== actividad.nombre_actividad) return false;
        const rel = relMismoNombreMap.get(a.id_actividad);
        return rel && relacion && rel.id_sistema === relacion.id_sistema && rel.id_equipo === relacion.id_equipo && rel.id_gerencia === relacion.id_gerencia;
      });
      const entregablesLista = Array.from(new Set(hermanos.map((h: any) => h.id_entregable ? (entregablesMap.get(h.id_entregable) || 'No especificado') : null).filter(Boolean)));

      return {
        ...actividad,
        sistema_abrev: relacion ? (sistemasMap.get(relacion.id_sistema) || 'N/A') : 'N/A',
        equipo_nombre: relacion?.id_equipo ? (equiposMap.get(relacion.id_equipo) || 'N/A') : 'N/A',
        gerencia_nombre: relacion?.id_gerencia ? (gerenciasNombreMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        gerencia_abrev: relacion?.id_gerencia ? (gerenciasAbrevMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        entregable_nombre: actividad.id_entregable ? (entregablesMap.get(actividad.id_entregable) || 'No especificado') : 'No especificado',
        entregables_lista: entregablesLista,
        cumplimiento: cumplimientoMap.get(actividad.id_actividad) || 'pendiente',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia,
        en_revision: enRevisionSet.has(actividad.id_actividad)
      };
    });
  },

  // Obtener actividades del usuario o de su equipo (unión)
  async getActividadesByUsuarioOTeam(idUsuario: number): Promise<ActividadConSistema[]> {
    // Obtener equipo del usuario
    const mapeo = await usuariosEquiposService.getByUsuario(idUsuario);

    // Asignaciones del usuario
    const { data: asignaciones, error: errorAsig } = await supabase
      .from('tb_usuario_actividades')
      .select('id_actividad, cumplimiento')
      .eq('id_usuario', idUsuario);
    if (errorAsig) throw errorAsig;

    const idsUser = (asignaciones || []).map(a => a.id_actividad);

    // Actividades por equipo
    let idsTeam: number[] = [];
    if (mapeo?.id_equipo) {
      const { data: relTeam } = await supabase
        .from('tb_as_sis_act')
        .select('id_actividad')
        .eq('id_equipo', mapeo.id_equipo);
      idsTeam = (relTeam || []).map((r: any) => r.id_actividad);
    }

    const actividadIds = Array.from(new Set([ ...idsUser, ...idsTeam ]));
    if (actividadIds.length === 0) return [];

    // Obtener actividades
    const { data: actividadesData, error: actError } = await supabase
      .from('tb_actividades')
      .select('*')
      .in('id_actividad', actividadIds)
      .order('id_actividad', { ascending: true });
    if (actError) throw actError;

    // Relaciones, sistemas, equipos, gerencias, entregables
    const { data: relacionesData } = await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo, id_gerencia')
      .in('id_actividad', actividadIds);
    const { data: sistemasData } = await supabase.from('tb_sistemas').select('id, abrev');
    const { data: equiposData } = await supabase.from('tb_equipos').select('id_equipo, desc_equipo');
    const { data: gerenciasData } = await supabase.from('tb_gerencias').select('id_gerencia, des_gerencia, abrev');
    const { data: entregablesData } = await supabase.from('entregables').select('id_entregable, nombre_entregables');

    const sistemasMap = new Map((sistemasData || []).map(s => [s.id, s.abrev]));
    const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
    const gerenciasNombreMap = new Map((gerenciasData || []).map(g => [g.id_gerencia, g.des_gerencia]));
    const gerenciasAbrevMap = new Map((gerenciasData || []).map((g: any) => [g.id_gerencia, g.abrev]));
    const entregablesMap = new Map((entregablesData || []).map((e: any) => [e.id_entregable, e.nombre_entregables]));
    const relacionesMap = new Map<number, any>();
    (relacionesData || []).forEach(rel => { if (!relacionesMap.has(rel.id_actividad)) relacionesMap.set(rel.id_actividad, rel); });

    const cumplimientoMap = new Map((asignaciones || []).map(a => [a.id_actividad, a.cumplimiento]));

    const { data: cumplAll } = await supabase
      .from('tb_usuario_actividades')
      .select('id_actividad, cumplimiento')
      .in('id_actividad', actividadIds);
    const enRevisionSet = new Set<number>();
    (cumplAll || []).forEach((c: any) => { if (c.cumplimiento === 'cumple') enRevisionSet.add(c.id_actividad); });

    // Agrupar entregables "hermanos"
    const nombresUnicos = Array.from(new Set((actividadesData || []).map((a: any) => a.nombre_actividad).filter(Boolean)));
    let otrasActividadesMismoNombre: any[] = [];
    if (nombresUnicos.length > 0) {
      const { data: actsMismoNombre } = await supabase
        .from('tb_actividades')
        .select('*')
        .in('nombre_actividad', nombresUnicos);
      otrasActividadesMismoNombre = actsMismoNombre || [];
    }
    const idsActsMismoNombre = (otrasActividadesMismoNombre || []).map((a: any) => a.id_actividad);
    const { data: relActsMismoNombre } = idsActsMismoNombre.length > 0 ? await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo, id_gerencia')
      .in('id_actividad', idsActsMismoNombre) : { data: [] as any[] } as any;
    const relMismoNombreMap = new Map<number, any>();
    (relActsMismoNombre || []).forEach((r: any) => relMismoNombreMap.set(r.id_actividad, r));

    return (actividadesData || []).map((actividad: any) => {
      const relacion = relacionesMap.get(actividad.id_actividad);
      // Buscar hermanos con mismo nombre y misma relación
      const hermanos = (otrasActividadesMismoNombre || []).filter((a: any) => {
        if (a.nombre_actividad !== actividad.nombre_actividad) return false;
        const rel = relMismoNombreMap.get(a.id_actividad);
        return rel && relacion && rel.id_sistema === relacion.id_sistema && rel.id_equipo === relacion.id_equipo && rel.id_gerencia === relacion.id_gerencia;
      });
      const entregablesLista = Array.from(new Set(hermanos.map((h: any) => h.id_entregable ? (entregablesMap.get(h.id_entregable) || 'No especificado') : null).filter(Boolean)));

      return {
        ...actividad,
        sistema_abrev: relacion ? (sistemasMap.get(relacion.id_sistema) || 'N/A') : 'N/A',
        equipo_nombre: relacion?.id_equipo ? (equiposMap.get(relacion.id_equipo) || 'N/A') : 'N/A',
        gerencia_nombre: relacion?.id_gerencia ? (gerenciasNombreMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        gerencia_abrev: relacion?.id_gerencia ? (gerenciasAbrevMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        entregable_nombre: actividad.id_entregable ? (entregablesMap.get(actividad.id_entregable) || 'No especificado') : 'No especificado',
        entregables_lista: entregablesLista,
        cumplimiento: cumplimientoMap.get(actividad.id_actividad) || 'pendiente',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia,
        en_revision: enRevisionSet.has(actividad.id_actividad)
      };
    });
  },

  // Actualizar cumplimiento de actividad
  async updateCumplimiento(
    idUsuario: number, 
    idActividad: number, 
    cumplimiento: 'cumple' | 'no_cumple'
  ): Promise<UsuarioActividad> {
    // Usar upsert para garantizar que exista la fila (soporta casos de actividades visibles por equipo)
    const { data, error } = await supabase
      .from('tb_usuario_actividades')
      .upsert([{ id_usuario: idUsuario, id_actividad: idActividad, cumplimiento }], { onConflict: 'id_usuario,id_actividad' })
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  // Obtener usuarios asignados a una actividad
  async getUsuariosByActividad(idActividad: number): Promise<Usuario[]> {
    const { data: asignaciones, error: errorAsig } = await supabase
      .from('tb_usuario_actividades')
      .select('id_usuario')
      .eq('id_actividad', idActividad);

    if (errorAsig) throw errorAsig;

    const usuarioIds = (asignaciones || []).map(a => a.id_usuario);
    
    if (usuarioIds.length === 0) {
      return [];
    }

    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('tb_usuarios')
      .select('*')
      .in('id_usuario', usuarioIds)
      .eq('rol', 'usuario')
      .order('fecha_creacion', { ascending: false });

    if (errorUsuarios) throw errorUsuarios;
    return usuarios || [];
  },

  // Superadmins
  async getSuperadmins(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('tb_usuarios')
      .select('*')
      .eq('rol', 'superadmin')
      .eq('estado', true);
    if (error) throw error;
    return data || [];
  }
};

// ============================================
// ADMINISTRACIÓN DE ACTIVIDADES POR ADMIN
// ============================================
export const adminActividadesService = {
  // Registrar que un admin creó una actividad
  async registerActividad(idAdmin: number, idActividad: number): Promise<void> {
    const { error } = await supabase
      .from('tb_admin_actividades')
      .insert([{
        id_admin: idAdmin,
        id_actividad: idActividad
      }]);

    if (error) throw error;
  },

  // Obtener TODAS las actividades creadas por todos los admins (para SuperAdmin)
  async getAllActividadesFromAdmins(): Promise<ActividadConSistema[]> {
    // Obtener todas las actividades de la tabla tb_admin_actividades
    const { data: todasAsignaciones, error: errorAsig } = await supabase
      .from('tb_admin_actividades')
      .select('id_actividad');

    if (errorAsig) throw errorAsig;

    const actividadIds = (todasAsignaciones || []).map(a => a.id_actividad);
    
    if (actividadIds.length === 0) {
      return [];
    }

    // Obtener actividades
    const { data: actividadesData, error: actError } = await supabase
      .from('tb_actividades')
      .select('*')
      .in('id_actividad', actividadIds)
      .order('id_actividad', { ascending: true });

    if (actError) throw actError;

    // Obtener relaciones, sistemas y equipos
    const { data: relacionesData } = await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo, id_gerencia')
      .in('id_actividad', actividadIds);

    const { data: cumplData } = await supabase
      .from('tb_usuario_actividades')
      .select('id_actividad, cumplimiento')
      .in('id_actividad', actividadIds);

    const { data: sistemasData } = await supabase.from('tb_sistemas').select('id, abrev');
    const { data: equiposData } = await supabase.from('tb_equipos').select('id_equipo, desc_equipo');
    const { data: gerenciasData } = await supabase.from('tb_gerencias').select('id_gerencia, des_gerencia, abrev');
    const { data: entregablesData } = await supabase.from('entregables').select('id_entregable, nombre_entregables');

    const sistemasMap = new Map((sistemasData || []).map(s => [s.id, s.abrev]));
    const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
    const gerenciasNombreMap = new Map((gerenciasData || []).map(g => [g.id_gerencia, g.des_gerencia]));
    const gerenciasAbrevMap = new Map((gerenciasData || []).map((g: any) => [g.id_gerencia, g.abrev]));
    const entregablesMap = new Map((entregablesData || []).map((e: any) => [e.id_entregable, e.nombre_entregables]));
    const relacionesMap = new Map<number, any>();
    (relacionesData || []).forEach(rel => {
      if (!relacionesMap.has(rel.id_actividad)) {
        relacionesMap.set(rel.id_actividad, rel);
      }
    });

    const enRevisionSet = new Set<number>();
    const asignadosCountMap = new Map<number, number>();
    (cumplData || []).forEach((c: any) => {
      if (c.cumplimiento === 'cumple') enRevisionSet.add(c.id_actividad);
      asignadosCountMap.set(c.id_actividad, (asignadosCountMap.get(c.id_actividad) || 0) + 1);
    });

    return (actividadesData || []).map((actividad: any) => {
      const relacion = relacionesMap.get(actividad.id_actividad);
      return {
        ...actividad,
        sistema_abrev: relacion ? (sistemasMap.get(relacion.id_sistema) || 'N/A') : 'N/A',
        equipo_nombre: relacion?.id_equipo ? (equiposMap.get(relacion.id_equipo) || 'N/A') : 'N/A',
        gerencia_nombre: relacion?.id_gerencia ? (gerenciasNombreMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        gerencia_abrev: relacion?.id_gerencia ? (gerenciasAbrevMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        entregable_nombre: actividad.id_entregable ? (entregablesMap.get(actividad.id_entregable) || 'No especificado') : 'No especificado',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia,
        en_revision: enRevisionSet.has(actividad.id_actividad),
        usuarios_asignados: asignadosCountMap.get(actividad.id_actividad) || 0
      };
    });
  },

  // Obtener administradores vinculados a una actividad
  async getAdminsByActividad(idActividad: number): Promise<Usuario[]> {
    const { data: asigs, error } = await supabase
      .from('tb_admin_actividades')
      .select('id_admin')
      .eq('id_actividad', idActividad);
    if (error) throw error;
    const ids = (asigs || []).map(a => a.id_admin);
    if (ids.length === 0) return [];
    const { data: usuarios, error: errU } = await supabase
      .from('tb_usuarios')
      .select('*')
      .in('id_usuario', ids)
      .eq('estado', true);
    if (errU) throw errU;
    return usuarios || [];
  },

  // Obtener actividades creadas por un admin específico
  async getActividadesByAdmin(idAdmin: number): Promise<ActividadConSistema[]> {
    const { data: asignaciones, error: errorAsig } = await supabase
      .from('tb_admin_actividades')
      .select('id_actividad')
      .eq('id_admin', idAdmin);

    if (errorAsig) throw errorAsig;

    const actividadIds = (asignaciones || []).map(a => a.id_actividad);
    
    if (actividadIds.length === 0) {
      return [];
    }

    // Obtener actividades
    const { data: actividadesData, error: actError } = await supabase
      .from('tb_actividades')
      .select('*')
      .in('id_actividad', actividadIds)
      .order('id_actividad', { ascending: true });

    if (actError) throw actError;

    // Obtener relaciones, sistemas y equipos
    const { data: relacionesData } = await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo, id_gerencia')
      .in('id_actividad', actividadIds);

    const { data: sistemasData } = await supabase.from('tb_sistemas').select('id, abrev');
    const { data: equiposData } = await supabase.from('tb_equipos').select('id_equipo, desc_equipo');
    const { data: gerenciasData } = await supabase.from('tb_gerencias').select('id_gerencia, des_gerencia, abrev');
    const { data: entregablesData } = await supabase.from('entregables').select('id_entregable, nombre_entregables');

    const sistemasMap = new Map((sistemasData || []).map(s => [s.id, s.abrev]));
    const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
    const gerenciasNombreMap = new Map((gerenciasData || []).map(g => [g.id_gerencia, g.des_gerencia]));
    const gerenciasAbrevMap = new Map((gerenciasData || []).map((g: any) => [g.id_gerencia, g.abrev]));
    const entregablesMap = new Map((entregablesData || []).map((e: any) => [e.id_entregable, e.nombre_entregables]));
    const relacionesMap = new Map<number, any>();
    (relacionesData || []).forEach(rel => {
      if (!relacionesMap.has(rel.id_actividad)) {
        relacionesMap.set(rel.id_actividad, rel);
      }
    });

    const { data: cumplData } = await supabase
      .from('tb_usuario_actividades')
      .select('id_actividad, cumplimiento')
      .in('id_actividad', actividadIds);
    const enRevisionSet = new Set<number>();
    const asignadosCountMap = new Map<number, number>();
    (cumplData || []).forEach((c: any) => {
      if (c.cumplimiento === 'cumple') enRevisionSet.add(c.id_actividad);
      asignadosCountMap.set(c.id_actividad, (asignadosCountMap.get(c.id_actividad) || 0) + 1);
    });

    return (actividadesData || []).map((actividad: any) => {
      const relacion = relacionesMap.get(actividad.id_actividad);
      return {
        ...actividad,
        sistema_abrev: relacion ? (sistemasMap.get(relacion.id_sistema) || 'N/A') : 'N/A',
        equipo_nombre: relacion?.id_equipo ? (equiposMap.get(relacion.id_equipo) || 'N/A') : 'N/A',
        gerencia_nombre: relacion?.id_gerencia ? (gerenciasNombreMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        gerencia_abrev: relacion?.id_gerencia ? (gerenciasAbrevMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        entregable_nombre: actividad.id_entregable ? (entregablesMap.get(actividad.id_entregable) || 'No especificado') : 'No especificado',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia,
        en_revision: enRevisionSet.has(actividad.id_actividad),
        usuarios_asignados: asignadosCountMap.get(actividad.id_actividad) || 0
      };
    });
  }
};

// ============================================
// CAMBIOS DE FECHA (máximo 2 veces)
// ============================================
export const cambiosFechaService = {
  // Obtener cantidad de cambios realizados
  async getCantidadCambios(idActividad: number): Promise<number> {
    const { data, error } = await supabase
      .from('tb_cambios_fecha')
      .select('id')
      .eq('id_actividad', idActividad);

    if (error) throw error;
    return (data || []).length;
  },

  // Registrar cambio de fecha
  async registrarCambio(
    idActividad: number,
    idAdmin: number,
    fechaAnterior: string | null,
    fechaNueva: string
  ): Promise<void> {
    const { error } = await supabase
      .from('tb_cambios_fecha')
      .insert([{
        id_actividad: idActividad,
        fecha_anterior: fechaAnterior,
        fecha_nueva: fechaNueva,
        modificado_por: idAdmin
      }]);

    if (error) throw error;
  }
};

// ============================================
// ESTADÍSTICAS DE SISTEMAS
// ============================================
export const sistemaStatsService = {
  // Obtener estadísticas completas de un sistema
  async getEstadisticas(idSistema: number): Promise<{
    actividades: ActividadConSistema[];
    usuarios: Usuario[];
    actividadesPorTrimestre: { trimestre: number; cantidad: number }[];
    actividadesPorEstado: { estado: string; cantidad: number }[];
  }> {
    // Obtener actividades del sistema
    const actividades = await actividadesService.getBySystem(idSistema);

    // Obtener IDs únicos de actividades
    const actividadIds = actividades.map(a => a.id_actividad);

    // Obtener usuarios asignados a estas actividades
    let usuariosSet = new Set<number>();
    let usuarios: Usuario[] = [];

    if (actividadIds.length > 0) {
      // Obtener asignaciones de usuarios con sus actividades
      const { data: asignaciones } = await supabase
        .from('tb_usuario_actividades')
        .select('id_usuario, id_actividad')
        .in('id_actividad', actividadIds);

      const usuarioIds = Array.from(
        new Set((asignaciones || []).map(a => a.id_usuario))
      );

      if (usuarioIds.length > 0) {
        const { data: usuariosData } = await supabase
          .from('tb_usuarios')
          .select('*')
          .in('id_usuario', usuarioIds);

        // Para cada usuario, obtener su gerencia y equipo desde sus actividades asignadas
        const { data: gerenciasData } = await supabase.from('tb_gerencias').select('id_gerencia, des_gerencia, abrev');
        const { data: equiposData } = await supabase.from('tb_equipos').select('id_equipo, desc_equipo');
        
        const gerenciasMap = new Map((gerenciasData || []).map((g: any) => [g.id_gerencia, { nombre: g.des_gerencia, abrev: g.abrev }]));
        const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
        
        // Enriquecer usuarios con gerencia y equipo
        usuarios = (usuariosData || []).map((usuario: any) => {
          // Buscar la primera actividad de este usuario para obtener gerencia/equipo
          const asignacionUsuario = (asignaciones || []).find(a => a.id_usuario === usuario.id_usuario);
          const actividadUsuario = asignacionUsuario ? actividades.find(a => a.id_actividad === asignacionUsuario.id_actividad) : null;
          
          return {
            ...usuario,
            gerencia_nombre: actividadUsuario?.gerencia_nombre,
            gerencia_abrev: actividadUsuario?.gerencia_abrev,
            equipo_nombre: actividadUsuario?.equipo_nombre,
            id_gerencia: actividadUsuario?.id_gerencia,
            id_equipo: actividadUsuario?.id_equipo
          };
        });
      }
    }

    // Calcular actividades por trimestre
    const actividadesPorTrimestre = [1, 2, 3, 4].map(trimestre => ({
      trimestre,
      cantidad: actividades.filter(a => a.trimestre === trimestre).length
    }));

    // Calcular actividades por estado_actividad (completado, pendiente, reprogramado)
    const estadosCount = actividades.reduce((acc, act) => {
      const estado = act.estado_actividad || 'pendiente';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actividadesPorEstado = Object.entries(estadosCount).map(([estado, cantidad]) => ({
      estado,
      cantidad
    }));

    return {
      actividades,
      usuarios,
      actividadesPorTrimestre,
      actividadesPorEstado
    };
  }
};
