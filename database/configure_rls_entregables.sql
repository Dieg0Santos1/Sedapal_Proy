-- ============================================
-- CONFIGURAR RLS PARA tb_entregables
-- ============================================

-- Habilitar RLS en la tabla
ALTER TABLE tb_entregables ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA USUARIOS
-- ============================================

-- Política 1: Los usuarios pueden insertar entregables en sus actividades asignadas
CREATE POLICY "Usuarios pueden subir entregables a sus actividades"
ON tb_entregables
FOR INSERT
TO authenticated
WITH CHECK (
    -- El usuario debe tener esta actividad asignada
    id_actividad IN (
        SELECT ua.id_actividad 
        FROM tb_usuario_actividades ua
        JOIN tb_usuarios u ON u.id_usuario = ua.id_usuario
        WHERE u.id_usuario = subido_por
    )
);

-- Política 2: Los usuarios pueden ver sus propios entregables
CREATE POLICY "Usuarios pueden ver sus entregables"
ON tb_entregables
FOR SELECT
TO authenticated
USING (
    -- El usuario puede ver los entregables que subió
    subido_por IN (
        SELECT id_usuario FROM tb_usuarios WHERE id_usuario = subido_por
    )
);

-- ============================================
-- POLÍTICAS PARA ADMINISTRADORES
-- ============================================

-- Política 3: Los administradores pueden ver todos los entregables
CREATE POLICY "Administradores pueden ver todos los entregables"
ON tb_entregables
FOR SELECT
TO authenticated
USING (
    -- Verificar si el usuario es admin o superadmin
    EXISTS (
        SELECT 1 FROM tb_usuarios
        WHERE id_usuario = auth.uid()::integer
        AND rol IN ('admin', 'superadmin')
    )
);

-- Política 4: Los administradores pueden insertar entregables
CREATE POLICY "Administradores pueden subir entregables"
ON tb_entregables
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tb_usuarios
        WHERE id_usuario = subido_por
        AND rol IN ('admin', 'superadmin')
    )
);

-- Política 5: Los administradores pueden eliminar entregables
CREATE POLICY "Administradores pueden eliminar entregables"
ON tb_entregables
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tb_usuarios
        WHERE id_usuario = auth.uid()::integer
        AND rol IN ('admin', 'superadmin')
    )
);

-- ============================================
-- POLÍTICA SIMPLIFICADA (SI LAS ANTERIORES NO FUNCIONAN)
-- ============================================

-- Si las políticas anteriores causan problemas, comenta todo lo anterior 
-- y descomenta esta política simple que permite todo a usuarios autenticados:

/*
DROP POLICY IF EXISTS "Usuarios pueden subir entregables a sus actividades" ON tb_entregables;
DROP POLICY IF EXISTS "Usuarios pueden ver sus entregables" ON tb_entregables;
DROP POLICY IF EXISTS "Administradores pueden ver todos los entregables" ON tb_entregables;
DROP POLICY IF EXISTS "Administradores pueden subir entregables" ON tb_entregables;
DROP POLICY IF EXISTS "Administradores pueden eliminar entregables" ON tb_entregables;

CREATE POLICY "Permitir todo a usuarios autenticados"
ON tb_entregables
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver las políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'tb_entregables';

-- Ver si RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'tb_entregables';
