-- ============================================
-- AGREGAR COLUMNA id_entregable A tb_actividades
-- ============================================

-- Agregar la columna id_entregable a la tabla tb_actividades
ALTER TABLE tb_actividades 
ADD COLUMN IF NOT EXISTS id_entregable INTEGER;

-- Agregar foreign key a la tabla entregables
ALTER TABLE tb_actividades 
ADD CONSTRAINT fk_actividades_entregable 
FOREIGN KEY (id_entregable) 
REFERENCES entregables(id_entregable) 
ON DELETE SET NULL;

-- Agregar comentario
COMMENT ON COLUMN tb_actividades.id_entregable IS 'ID del tipo de entregable asociado a esta actividad';

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_actividades_entregable ON tb_actividades(id_entregable);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tb_actividades' 
AND column_name = 'id_entregable';

SELECT 'Columna id_entregable agregada exitosamente a tb_actividades' AS resultado;
