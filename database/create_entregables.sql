-- ============================================
-- TABLA: tb_entregables
-- Descripción: Almacena la información de los archivos subidos por los usuarios
-- ============================================

-- Crear tabla sin foreign keys primero
CREATE TABLE IF NOT EXISTS tb_entregables (
    id SERIAL PRIMARY KEY,
    id_actividad INTEGER NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamaño_archivo BIGINT,
    subido_por INTEGER NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agregar foreign keys después (ejecutar SOLO si las columnas existen en las tablas referenciadas)
-- Si obtienes error, verifica que tb_actividades tenga la columna id_actividad como PRIMARY KEY
-- y que tb_usuarios tenga id_usuario como PRIMARY KEY

-- Descomentar las siguientes líneas una vez verificadas las tablas:
/*
ALTER TABLE tb_entregables 
    ADD CONSTRAINT fk_entregables_actividad 
    FOREIGN KEY (id_actividad) REFERENCES tb_actividades(id_actividad) ON DELETE CASCADE;

ALTER TABLE tb_entregables 
    ADD CONSTRAINT fk_entregables_usuario 
    FOREIGN KEY (subido_por) REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE;
*/

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_entregables_actividad ON tb_entregables(id_actividad);
CREATE INDEX IF NOT EXISTS idx_entregables_usuario ON tb_entregables(subido_por);
CREATE INDEX IF NOT EXISTS idx_entregables_fecha ON tb_entregables(fecha_subida DESC);

-- Comentarios
COMMENT ON TABLE tb_entregables IS 'Almacena los archivos entregables subidos por los usuarios para cada actividad';
COMMENT ON COLUMN tb_entregables.id IS 'Identificador único del entregable';
COMMENT ON COLUMN tb_entregables.id_actividad IS 'ID de la actividad relacionada';
COMMENT ON COLUMN tb_entregables.nombre_archivo IS 'Nombre original del archivo';
COMMENT ON COLUMN tb_entregables.ruta_archivo IS 'Ruta del archivo en Supabase Storage';
COMMENT ON COLUMN tb_entregables.tamaño_archivo IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN tb_entregables.subido_por IS 'ID del usuario que subió el archivo';
COMMENT ON COLUMN tb_entregables.fecha_subida IS 'Fecha y hora en que se subió el archivo';

-- ============================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- ============================================

-- NOTA: Los siguientes comandos deben ejecutarse desde la interfaz de Supabase Storage:

-- 1. Crear bucket 'archivos-actividades':
--    - Ir a Storage en el panel de Supabase
--    - Crear nuevo bucket con nombre: archivos-actividades
--    - Configurar como privado (no público)
--    - Tamaño máximo de archivo: 50MB (o según necesidad)

-- 2. Configurar políticas de seguridad (RLS):
--    Las políticas deben permitir:
--    - Los usuarios pueden subir archivos a sus actividades asignadas
--    - Los usuarios pueden leer archivos de sus actividades
--    - Los administradores pueden leer todos los archivos
--    - Los administradores pueden eliminar archivos

-- Política de lectura para usuarios
CREATE POLICY "Usuarios pueden ver archivos de sus actividades"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'archivos-actividades'
    AND auth.uid()::text IN (
        SELECT u.id_usuario::text 
        FROM tb_usuarios u
        JOIN tb_usuario_actividades ua ON ua.id_usuario = u.id_usuario
        WHERE (storage.foldername(name))[1] = ua.id_actividad::text
    )
);

-- Política de inserción para usuarios
CREATE POLICY "Usuarios pueden subir archivos a sus actividades"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'archivos-actividades'
    AND auth.uid()::text IN (
        SELECT u.id_usuario::text 
        FROM tb_usuarios u
        JOIN tb_usuario_actividades ua ON ua.id_usuario = u.id_usuario
        WHERE (storage.foldername(name))[1] = ua.id_actividad::text
    )
);

-- Política de lectura para administradores
CREATE POLICY "Administradores pueden ver todos los archivos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'archivos-actividades'
    AND auth.uid()::text IN (
        SELECT id_usuario::text 
        FROM tb_usuarios 
        WHERE rol IN ('admin', 'superadmin')
    )
);

-- Política de eliminación para administradores
CREATE POLICY "Administradores pueden eliminar archivos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'archivos-actividades'
    AND auth.uid()::text IN (
        SELECT id_usuario::text 
        FROM tb_usuarios 
        WHERE rol IN ('admin', 'superadmin')
    )
);

-- ============================================
-- TRIGGERS Y FUNCIONES ADICIONALES
-- ============================================

-- Función para limpiar archivos huérfanos del storage cuando se elimina un registro
CREATE OR REPLACE FUNCTION cleanup_storage_on_entregable_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar el archivo del storage
    PERFORM storage.delete_object('archivos-actividades', OLD.ruta_archivo);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la limpieza
CREATE TRIGGER trigger_cleanup_storage_entregable
    AFTER DELETE ON tb_entregables
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_storage_on_entregable_delete();

-- ============================================
-- PERMISOS
-- ============================================

-- Asegurar que los usuarios autenticados tengan acceso a la tabla
GRANT SELECT, INSERT ON tb_entregables TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE tb_entregables_id_seq TO authenticated;

-- Los administradores tienen permisos completos
GRANT ALL ON tb_entregables TO service_role;
