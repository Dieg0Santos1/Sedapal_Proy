-- ============================================
-- TABLA: tb_entregables
-- VERSIÓN SIMPLIFICADA - Sin foreign key a tb_actividades
-- (debido a que tiene PRIMARY KEY compuesta)
-- ============================================

-- Paso 1: Crear la tabla
CREATE TABLE IF NOT EXISTS tb_entregables (
    id SERIAL PRIMARY KEY,
    id_actividad INTEGER NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamaño_archivo BIGINT,
    subido_por INTEGER NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Paso 2: Agregar SOLO foreign key a usuarios (esta sí funciona)
ALTER TABLE tb_entregables 
    ADD CONSTRAINT fk_entregables_usuario 
    FOREIGN KEY (subido_por) REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE;

-- Paso 3: Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_entregables_actividad ON tb_entregables(id_actividad);
CREATE INDEX IF NOT EXISTS idx_entregables_usuario ON tb_entregables(subido_por);
CREATE INDEX IF NOT EXISTS idx_entregables_fecha ON tb_entregables(fecha_subida DESC);

-- Paso 4: Agregar comentarios
COMMENT ON TABLE tb_entregables IS 'Almacena los archivos entregables subidos por los usuarios para cada actividad';
COMMENT ON COLUMN tb_entregables.id IS 'Identificador único del entregable';
COMMENT ON COLUMN tb_entregables.id_actividad IS 'ID de la actividad relacionada (sin foreign key por PRIMARY KEY compuesta)';
COMMENT ON COLUMN tb_entregables.nombre_archivo IS 'Nombre original del archivo';
COMMENT ON COLUMN tb_entregables.ruta_archivo IS 'Ruta del archivo en Supabase Storage';
COMMENT ON COLUMN tb_entregables.tamaño_archivo IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN tb_entregables.subido_por IS 'ID del usuario que subió el archivo';
COMMENT ON COLUMN tb_entregables.fecha_subida IS 'Fecha y hora en que se subió el archivo';

-- Paso 5: Configurar permisos
GRANT SELECT, INSERT ON tb_entregables TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE tb_entregables_id_seq TO authenticated;
GRANT ALL ON tb_entregables TO service_role;

-- ============================================
-- TRIGGER PARA LIMPIEZA AUTOMÁTICA
-- ============================================

-- Función para limpiar archivos del storage cuando se elimina un registro
CREATE OR REPLACE FUNCTION cleanup_storage_on_entregable_delete()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        PERFORM storage.delete_object('archivos-actividades', OLD.ruta_archivo);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'No se pudo eliminar el archivo del storage: %', OLD.ruta_archivo;
    END;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la limpieza
DROP TRIGGER IF EXISTS trigger_cleanup_storage_entregable ON tb_entregables;
CREATE TRIGGER trigger_cleanup_storage_entregable
    AFTER DELETE ON tb_entregables
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_storage_on_entregable_delete();

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- No se puede crear foreign key a tb_actividades porque tiene PRIMARY KEY compuesta.
-- La integridad referencial se manejará a nivel de aplicación.
-- El índice en id_actividad ayudará con el rendimiento de las consultas.

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 'Tabla tb_entregables creada exitosamente' AS resultado;

-- Verificar estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tb_entregables'
ORDER BY ordinal_position;

-- Verificar foreign keys
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'tb_entregables'
    AND tc.constraint_type = 'FOREIGN KEY';
