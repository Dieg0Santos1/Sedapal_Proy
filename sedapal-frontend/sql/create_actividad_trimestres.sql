-- Tabla para almacenar múltiples trimestres por actividad
CREATE TABLE IF NOT EXISTS tb_actividad_trimestres (
  id SERIAL PRIMARY KEY,
  id_actividad INTEGER NOT NULL REFERENCES tb_actividades(id_actividad) ON DELETE CASCADE,
  trimestre INTEGER NOT NULL CHECK (trimestre >= 1 AND trimestre <= 4),
  UNIQUE(id_actividad, trimestre)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_actividad_trimestres_actividad ON tb_actividad_trimestres(id_actividad);

COMMENT ON TABLE tb_actividad_trimestres IS 'Almacena los múltiples trimestres asignados a cada actividad';
COMMENT ON COLUMN tb_actividad_trimestres.id_actividad IS 'ID de la actividad';
COMMENT ON COLUMN tb_actividad_trimestres.trimestre IS 'Número del trimestre (1-4)';
