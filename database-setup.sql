-- ============================================
-- SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS
-- SEDAPAL - Sistema de Gestión de Actividades
-- ============================================

-- 1. CREAR TABLA DE USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('superadmin', 'admin', 'responsable')),
  nombre VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Insertar usuario superadmin de prueba (password: admin123)
INSERT INTO usuarios (email, password, rol, nombre) 
VALUES ('admin@sedapal.com.pe', 'admin123', 'superadmin', 'Administrador Principal')
ON CONFLICT (email) DO NOTHING;


-- 2. AGREGAR COLUMNAS FALTANTES A tb_sistemas
-- ============================================
-- Agregar columna administrador
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tb_sistemas' AND column_name = 'administrador'
  ) THEN
    ALTER TABLE tb_sistemas ADD COLUMN administrador VARCHAR(255);
  END IF;
END $$;

-- Agregar columna suplente
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tb_sistemas' AND column_name = 'suplente'
  ) THEN
    ALTER TABLE tb_sistemas ADD COLUMN suplente VARCHAR(255);
  END IF;
END $$;


-- 3. AGREGAR COLUMNAS FALTANTES A tb_actividades
-- ============================================
-- Agregar columna trimestre
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tb_actividades' AND column_name = 'trimestre'
  ) THEN
    ALTER TABLE tb_actividades ADD COLUMN trimestre INTEGER CHECK (trimestre BETWEEN 1 AND 4);
  END IF;
END $$;

-- Agregar columna fecha_sustento
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tb_actividades' AND column_name = 'fecha_sustento'
  ) THEN
    ALTER TABLE tb_actividades ADD COLUMN fecha_sustento DATE;
  END IF;
END $$;

-- Agregar columna evaluacion
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tb_actividades' AND column_name = 'evaluacion'
  ) THEN
    ALTER TABLE tb_actividades ADD COLUMN evaluacion VARCHAR(50) CHECK (evaluacion IN ('conforme', 'pendiente', 'no conforme'));
  END IF;
END $$;

-- Agregar columna estado_actividad (texto para Programado, Completado, Reprogramado)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tb_actividades' AND column_name = 'estado_actividad'
  ) THEN
    ALTER TABLE tb_actividades ADD COLUMN estado_actividad VARCHAR(50) CHECK (estado_actividad IN ('pendiente', 'reprogramado', 'completado'));
  END IF;
END $$;


-- 4. DATOS DE PRUEBA (OPCIONAL)
-- ============================================
-- Insertar sistemas de ejemplo si la tabla está vacía
INSERT INTO tb_sistemas (desc_sistema, abrev, administrador, suplente, estado) 
VALUES 
  ('Sistema Integrado de Gestión', 'SIG', 'Juan Pérez', 'María López', 1),
  ('5 Disciplinas', '5S', 'Yennyfert Aguilar Candia', 'Marilce Orbegoso Reyes', 1),
  ('Gestión Integral de Riesgos', 'GIR', 'Carlos Ramírez', 'Ana Torres', 1),
  ('Sistema de Control Interno', 'SCI', 'Pedro González', 'Laura Martínez', 1),
  ('Buen Gobierno Corporativo', 'BGC', 'Luis Fernández', 'Carmen Ruiz', 1)
ON CONFLICT DO NOTHING;


-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verificar que todo se creó correctamente
SELECT 'Tabla usuarios creada' as mensaje 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios');

SELECT 'Columnas agregadas a tb_sistemas' as mensaje 
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tb_sistemas' AND column_name = 'administrador');

SELECT 'Columnas agregadas a tb_actividades' as mensaje 
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tb_actividades' AND column_name = 'trimestre');
