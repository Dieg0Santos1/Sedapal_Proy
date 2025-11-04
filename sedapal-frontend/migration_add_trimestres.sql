-- Agregar columna trimestres para almacenar múltiples trimestres seleccionados
-- Este campo es un array de enteros (integer[]) que almacena todos los trimestres seleccionados

ALTER TABLE tb_actividades 
ADD COLUMN IF NOT EXISTS trimestres integer[];

-- Migrar datos existentes: copiar el valor de 'trimestre' al array 'trimestres'
-- Solo actualizar registros donde trimestres es NULL
UPDATE tb_actividades 
SET trimestres = ARRAY[trimestre]
WHERE trimestres IS NULL AND trimestre IS NOT NULL;

-- Opcional: Crear un índice para mejorar consultas que filtren por trimestres
CREATE INDEX IF NOT EXISTS idx_tb_actividades_trimestres 
ON tb_actividades USING GIN (trimestres);

-- Comentario sobre la columna
COMMENT ON COLUMN tb_actividades.trimestres IS 'Array de trimestres seleccionados para la actividad. El campo "trimestre" mantiene el último/principal trimestre para compatibilidad.';
