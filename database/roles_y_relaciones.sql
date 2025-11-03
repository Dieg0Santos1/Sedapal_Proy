-- ============================================
-- SCRIPT PARA IMPLEMENTAR SISTEMA DE ROLES
-- ============================================

-- Tabla de usuarios (SuperAdmin, Admin, Usuario)
CREATE TABLE IF NOT EXISTS tb_usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('superadmin', 'admin', 'usuario')) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT TRUE
);

-- Tabla de relación: Administradores y Sistemas asignados
CREATE TABLE IF NOT EXISTS tb_admin_sistemas (
    id SERIAL PRIMARY KEY,
    id_admin INT NOT NULL REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
    id_sistema INT NOT NULL REFERENCES tb_sistemas(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_admin, id_sistema)
);

-- Tabla de relación: Administradores y Actividades creadas
CREATE TABLE IF NOT EXISTS tb_admin_actividades (
    id SERIAL PRIMARY KEY,
    id_admin INT NOT NULL REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
    id_actividad INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_admin, id_actividad)
);

-- Tabla de relación: Usuarios y Actividades asignadas
CREATE TABLE IF NOT EXISTS tb_usuario_actividades (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
    id_actividad INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cumplimiento VARCHAR(20) CHECK (cumplimiento IN ('cumple', 'no_cumple', 'pendiente')) DEFAULT 'pendiente',
    UNIQUE(id_usuario, id_actividad)
);

-- Tabla para controlar cambios de fecha (máximo 2 veces para admins)
CREATE TABLE IF NOT EXISTS tb_cambios_fecha (
    id SERIAL PRIMARY KEY,
    id_actividad INT NOT NULL,
    fecha_anterior DATE,
    fecha_nueva DATE NOT NULL,
    modificado_por INT NOT NULL REFERENCES tb_usuarios(id_usuario),
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_admin_sistemas_admin ON tb_admin_sistemas(id_admin);
CREATE INDEX idx_admin_sistemas_sistema ON tb_admin_sistemas(id_sistema);
CREATE INDEX idx_admin_actividades_admin ON tb_admin_actividades(id_admin);
CREATE INDEX idx_admin_actividades_actividad ON tb_admin_actividades(id_actividad);
CREATE INDEX idx_usuario_actividades_usuario ON tb_usuario_actividades(id_usuario);
CREATE INDEX idx_usuario_actividades_actividad ON tb_usuario_actividades(id_actividad);
CREATE INDEX idx_cambios_fecha_actividad ON tb_cambios_fecha(id_actividad);

-- Agregar campo de fecha_maxima_entrega a tb_actividades si no existe
ALTER TABLE tb_actividades 
ADD COLUMN IF NOT EXISTS fecha_maxima_entrega DATE;

-- Insertar usuario SuperAdmin de prueba (contraseña: superadmin123)
INSERT INTO tb_usuarios (nombre, apellido, email, contrasena, rol)
VALUES ('Super', 'Administrador', 'superadmin@sedapal.com', 'superadmin123', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- Comentarios en las tablas
COMMENT ON TABLE tb_usuarios IS 'Almacena todos los usuarios del sistema (SuperAdmin, Admin, Usuario)';
COMMENT ON TABLE tb_admin_sistemas IS 'Relación entre administradores y los sistemas que les fueron delegados';
COMMENT ON TABLE tb_admin_actividades IS 'Relación entre administradores y las actividades que crearon';
COMMENT ON TABLE tb_usuario_actividades IS 'Relación entre usuarios y las actividades que les fueron asignadas';
COMMENT ON TABLE tb_cambios_fecha IS 'Historial de cambios de fecha máxima de entrega (límite 2 cambios por actividad)';
