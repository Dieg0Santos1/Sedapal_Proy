-- Crear tabla de asignación de administradores a sistemas
CREATE TABLE IF NOT EXISTS tb_admin_sistemas (
    id_admin_sistema BIGSERIAL PRIMARY KEY,
    id_admin BIGINT NOT NULL,
    id_sistema BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Foreign keys
    CONSTRAINT fk_admin_sistemas_admin 
        FOREIGN KEY (id_admin) 
        REFERENCES tb_usuarios(id_usuario) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_admin_sistemas_sistema 
        FOREIGN KEY (id_sistema) 
        REFERENCES tb_sistemas(id_sistema) 
        ON DELETE CASCADE,
    
    -- Unique constraint para evitar duplicados
    CONSTRAINT uk_admin_sistema 
        UNIQUE (id_admin, id_sistema)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_admin_sistemas_admin ON tb_admin_sistemas(id_admin);
CREATE INDEX idx_admin_sistemas_sistema ON tb_admin_sistemas(id_sistema);
CREATE INDEX idx_admin_sistemas_estado ON tb_admin_sistemas(estado);

-- Comentarios
COMMENT ON TABLE tb_admin_sistemas IS 'Tabla de asignación de administradores a sistemas';
COMMENT ON COLUMN tb_admin_sistemas.id_admin IS 'ID del usuario administrador';
COMMENT ON COLUMN tb_admin_sistemas.id_sistema IS 'ID del sistema asignado';
COMMENT ON COLUMN tb_admin_sistemas.fecha_asignacion IS 'Fecha de asignación del sistema';
COMMENT ON COLUMN tb_admin_sistemas.estado IS 'Estado de la asignación (true=activo, false=inactivo)';
