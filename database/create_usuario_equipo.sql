-- ============================================
-- TABLA: tb_usuario_equipo
-- Relaciona un usuario con una Gerencia y un Equipo
-- ============================================

CREATE TABLE IF NOT EXISTS public.tb_usuario_equipo (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL UNIQUE,
    id_gerencia INTEGER,
    id_equipo INTEGER,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_usuario_equipo_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES public.tb_usuarios(id_usuario)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_usuario_equipo_gerencia
        FOREIGN KEY (id_gerencia)
        REFERENCES public.tb_gerencias(id_gerencia)
        ON DELETE SET NULL,
        
    CONSTRAINT fk_usuario_equipo_equipo
        FOREIGN KEY (id_equipo)
        REFERENCES public.tb_equipos(id_equipo)
        ON DELETE SET NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_equipo_usuario ON public.tb_usuario_equipo(id_usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_equipo_gerencia ON public.tb_usuario_equipo(id_gerencia);
CREATE INDEX IF NOT EXISTS idx_usuario_equipo_equipo ON public.tb_usuario_equipo(id_equipo);

-- Comentarios
COMMENT ON TABLE public.tb_usuario_equipo IS 'Relación entre usuarios y equipos/gerencias';
COMMENT ON COLUMN public.tb_usuario_equipo.id_usuario IS 'ID del usuario (único)';
COMMENT ON COLUMN public.tb_usuario_equipo.id_gerencia IS 'ID de la gerencia asignada';
COMMENT ON COLUMN public.tb_usuario_equipo.id_equipo IS 'ID del equipo asignado';
