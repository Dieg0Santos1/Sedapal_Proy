-- ============================================
-- CONFIGURAR POLÍTICAS DE STORAGE
-- Para el bucket: archivos-actividades
-- ============================================

-- IMPORTANTE: Primero asegúrate de que el bucket existe
-- Ve a Storage > archivos-actividades en Supabase

-- ============================================
-- POLÍTICA SIMPLIFICADA - RECOMENDADA PARA EMPEZAR
-- ============================================

-- Permitir que usuarios autenticados suban archivos
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'archivos-actividades'
);

-- Permitir que usuarios autenticados lean archivos
CREATE POLICY "Usuarios autenticados pueden leer archivos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'archivos-actividades'
);

-- Permitir que administradores eliminen archivos
CREATE POLICY "Administradores pueden eliminar archivos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'archivos-actividades'
    AND EXISTS (
        SELECT 1 FROM tb_usuarios
        WHERE id_usuario = auth.uid()::integer
        AND rol IN ('admin', 'superadmin')
    )
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver las políticas del bucket
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%archivos-actividades%' 
   OR policyname LIKE '%Usuarios autenticados%'
   OR policyname LIKE '%Administradores%';
