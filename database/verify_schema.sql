-- ============================================
-- SCRIPT DE VERIFICACIÓN DEL ESQUEMA
-- Ejecuta estos comandos ANTES de crear la tabla tb_entregables
-- ============================================

-- 1. Verificar estructura de tb_actividades
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tb_actividades'
ORDER BY ordinal_position;

-- 2. Verificar PRIMARY KEY de tb_actividades
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tb_actividades' 
    AND tc.constraint_type = 'PRIMARY KEY';

-- 3. Verificar estructura de tb_usuarios
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tb_usuarios'
ORDER BY ordinal_position;

-- 4. Verificar PRIMARY KEY de tb_usuarios
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tb_usuarios' 
    AND tc.constraint_type = 'PRIMARY KEY';

-- ============================================
-- RESULTADOS ESPERADOS:
-- ============================================
-- tb_actividades debe tener una columna llamada 'id_actividad' como PRIMARY KEY
-- tb_usuarios debe tener una columna llamada 'id_usuario' como PRIMARY KEY
--
-- Si los nombres son diferentes, anota los nombres correctos y ajusta el script
-- create_entregables.sql en consecuencia.
