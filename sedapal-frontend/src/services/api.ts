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
  fecha_sustento: string | null;
  evaluacion: 'conforme' | 'pendiente' | 'no conforme' | null;
  estado_actividad: 'pendiente' | 'reprogramado' | 'completado' | null;
};

export type ActividadConSistema = Actividad & {
  sistema_abrev?: string;
  entregable_nombre?: string;
  equipo_nombre?: string;
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

// ============================================
// EQUIPOS
// ============================================
export const equiposService = {
  // Obtener todos los equipos con su gerencia
  async getAll(): Promise<Equipo[]> {
    const { data, error } = await supabase
      .from('tb_equipos')
      .select('*')
      .order('id_equipo', { ascending: true });

    if (error) {
      console.error('Error al cargar equipos desde Supabase:', error);
      throw error;
    }
    
    console.log('Datos de equipos desde Supabase (con todos los campos):', data);
    if (data && data.length > 0) {
      console.log('Campos del primer equipo:', Object.keys(data[0]));
    }
    return data || [];
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
  // Obtener todos los sistemas
  async getAll(): Promise<Sistema[]> {
    const { data, error } = await supabase
      .from('tb_sistemas')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
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
    estado_actividad: 'pendiente' | 'reprogramado' | 'completado';
    fecha_sustento?: string;
    evaluacion: 'conforme' | 'pendiente' | 'no conforme';
    cod_cat_int?: number;
    id_gerencia?: number;
    id_equipo?: number;
  }): Promise<Actividad> {
    // Primero crear la actividad
    const { data: nuevaActividad, error: errorActividad } = await supabase
      .from('tb_actividades')
      .insert([{
        nombre_actividad: actividad.nombre_actividad,
        trimestre: actividad.trimestre,
        estado_actividad: actividad.estado_actividad,
        fecha_sustento: actividad.fecha_sustento,
        evaluacion: actividad.evaluacion,
        cod_cat_int: actividad.cod_cat_int || 1,
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
  }
};

export const usuariosService = {
  // Crear administrador
  async createAdmin(admin: {
    nombre: string;
    apellido: string;
    email: string;
    contrasena: string;
    idSistema: number;
  }): Promise<Usuario> {
    try {
      // Crear el usuario directamente en Supabase
      const { data: nuevoAdmin, error: errorUsuario } = await supabase
        .from('tb_usuarios')
        .insert([{
          nombre: admin.nombre,
          apellido: admin.apellido,
          email: admin.email,
          contrasena: admin.contrasena,
          rol: 'admin',
          estado: true
        }])
        .select()
        .single();

      if (errorUsuario) throw errorUsuario;

      // Asignar el sistema al admin
      const { error: errorAsignacion } = await supabase
        .from('tb_admin_sistemas')
        .insert([{
          id_admin: nuevoAdmin.id_usuario,
          id_sistema: admin.idSistema
        }]);

      if (errorAsignacion) {
        // Si falla la asignación, eliminar el usuario creado
        await supabase
          .from('tb_usuarios')
          .delete()
          .eq('id_usuario', nuevoAdmin.id_usuario);
        throw errorAsignacion;
      }

      return nuevoAdmin;
    } catch (error: any) {
      console.error('Error completo en createAdmin:', error);
      throw new Error('Error al crear administrador: ' + error.message);
    }
  },

  // Crear usuario
  async createUser(usuario: {
    nombre: string;
    apellido: string;
    email: string;
    contrasena: string;
    idActividad: number;
  }): Promise<Usuario> {
    try {
      // Crear el usuario directamente en Supabase
      const { data: nuevoUsuario, error: errorUsuario } = await supabase
        .from('tb_usuarios')
        .insert([{
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          contrasena: usuario.contrasena,
          rol: 'usuario',
          estado: true
        }])
        .select()
        .single();

      if (errorUsuario) throw errorUsuario;

      return nuevoUsuario;
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
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

      // Obtener los datos completos de los sistemas
      const { data: sistemas, error: errorSistemas } = await supabase
        .from('tb_sistemas')
        .select('*')
        .in('id', sistemaIds)
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

    // Obtener relaciones, sistemas y equipos
    const { data: relacionesData } = await supabase
      .from('tb_as_sis_act')
      .select('id_actividad, id_sistema, id_equipo')
      .in('id_actividad', actividadIds);

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
    
    const cumplimientoMap = new Map((asignaciones || []).map(a => [a.id_actividad, a.cumplimiento]));

    return (actividadesData || []).map((actividad: any) => {
      const relacion = relacionesMap.get(actividad.id_actividad);
      return {
        ...actividad,
        sistema_abrev: relacion ? (sistemasMap.get(relacion.id_sistema) || 'N/A') : 'N/A',
        equipo_nombre: relacion?.id_equipo ? (equiposMap.get(relacion.id_equipo) || 'N/A') : 'N/A',
        cumplimiento: cumplimientoMap.get(actividad.id_actividad) || 'pendiente',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia
      };
    });
  },

  // Actualizar cumplimiento de actividad
  async updateCumplimiento(
    idUsuario: number, 
    idActividad: number, 
    cumplimiento: 'cumple' | 'no_cumple'
  ): Promise<UsuarioActividad> {
    const { data, error } = await supabase
      .from('tb_usuario_actividades')
      .update({ cumplimiento })
      .eq('id_usuario', idUsuario)
      .eq('id_actividad', idActividad)
      .select()
      .single();

    if (error) throw error;
    return data;
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

    const { data: sistemasData } = await supabase.from('tb_sistemas').select('id, abrev');
    const { data: equiposData } = await supabase.from('tb_equipos').select('id_equipo, desc_equipo');
    const { data: gerenciasData } = await supabase.from('tb_gerencia').select('id_gerencia, desc_gerencia');

    const sistemasMap = new Map((sistemasData || []).map(s => [s.id, s.abrev]));
    const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
    const gerenciasMap = new Map((gerenciasData || []).map(g => [g.id_gerencia, g.desc_gerencia]));
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
        gerencia_nombre: relacion?.id_gerencia ? (gerenciasMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia
      };
    });
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
    const { data: gerenciasData } = await supabase.from('tb_gerencia').select('id_gerencia, desc_gerencia');

    const sistemasMap = new Map((sistemasData || []).map(s => [s.id, s.abrev]));
    const equiposMap = new Map((equiposData || []).map(e => [e.id_equipo, e.desc_equipo]));
    const gerenciasMap = new Map((gerenciasData || []).map(g => [g.id_gerencia, g.desc_gerencia]));
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
        gerencia_nombre: relacion?.id_gerencia ? (gerenciasMap.get(relacion.id_gerencia) || 'N/A') : 'N/A',
        id_sistema: relacion?.id_sistema,
        id_equipo: relacion?.id_equipo,
        id_gerencia: relacion?.id_gerencia
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
      // Obtener asignaciones de usuarios
      const { data: asignaciones } = await supabase
        .from('tb_usuario_actividades')
        .select('id_usuario')
        .in('id_actividad', actividadIds);

      const usuarioIds = Array.from(
        new Set((asignaciones || []).map(a => a.id_usuario))
      );

      if (usuarioIds.length > 0) {
        const { data: usuariosData } = await supabase
          .from('tb_usuarios')
          .select('*')
          .in('id_usuario', usuarioIds);

        usuarios = usuariosData || [];
      }
    }

    // Calcular actividades por trimestre
    const actividadesPorTrimestre = [1, 2, 3, 4].map(trimestre => ({
      trimestre,
      cantidad: actividades.filter(a => a.trimestre === trimestre).length
    }));

    // Calcular actividades por estado de evaluación
    const estadosCount = actividades.reduce((acc, act) => {
      const estado = act.evaluacion || 'pendiente';
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
