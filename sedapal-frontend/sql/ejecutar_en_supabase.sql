-- ============================================
-- SCRIPT RÁPIDO PARA SUPABASE SQL EDITOR
-- ============================================
-- Copia y pega cada sección en el SQL Editor de Supabase
-- Ejecuta una por una para verificar cada paso

-- ============================================
-- PASO 1: DIAGNÓSTICO
-- ============================================
-- Ejecuta esto primero para ver si tienes duplicados

SELECT 
    id_actividad, 
    id_sistema, 
    id_equipo,
    COUNT(*) as cantidad
FROM tb_as_sis_act
GROUP BY id_actividad, id_sistema, id_equipo
HAVING COUNT(*) > 1;

-- Si este query devuelve filas, continúa con los siguientes pasos
-- Si NO devuelve filas, ¡no tienes duplicados! Solo ejecuta el PASO 4

-- ============================================
-- PASO 2: VER DETALLES (Solo si hay duplicados)
-- ============================================

WITH duplicados AS (
    SELECT 
        id_actividad, 
        id_sistema, 
        id_equipo,
        COUNT(*) as cantidad
    FROM tb_as_sis_act
    GROUP BY id_actividad, id_sistema, id_equipo
    HAVING COUNT(*) > 1
)
SELECT r.*
FROM tb_as_sis_act r
INNER JOIN duplicados d 
    ON r.id_actividad = d.id_actividad 
    AND r.id_sistema = d.id_sistema
    AND r.id_equipo = d.id_equipo
ORDER BY r.id_actividad;

-- ============================================
-- PASO 3: ELIMINAR DUPLICADOS (⚠️ CUIDADO!)
-- ============================================
-- Este paso ELIMINA registros duplicados
-- Solo ejecuta después de revisar el PASO 2

WITH duplicados_con_row AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY id_actividad, id_sistema, id_equipo 
            ORDER BY id
        ) as rn
    FROM tb_as_sis_act
)
DELETE FROM tb_as_sis_act
WHERE id IN (
    SELECT id 
    FROM duplicados_con_row 
    WHERE rn > 1
);

-- ============================================
-- PASO 4: AGREGAR RESTRICCIÓN UNIQUE
-- ============================================
-- Esto previene futuros duplicados
-- Solo ejecuta después de limpiar duplicados (PASO 3)

ALTER TABLE tb_as_sis_act 
ADD CONSTRAINT uq_actividad_sistema_equipo 
UNIQUE (id_actividad, id_sistema, id_equipo);

-- ============================================
-- PASO 5: VERIFICACIÓN
-- ============================================
-- Ejecuta esto al final para confirmar que todo está bien

-- No debería devolver filas
SELECT 
    id_actividad, 
    id_sistema, 
    id_equipo,
    COUNT(*) as cantidad
FROM tb_as_sis_act
GROUP BY id_actividad, id_sistema, id_equipo
HAVING COUNT(*) > 1;

-- ============================================
-- PASO 6: VER TRIGGERS Y POLÍTICAS RLS
-- ============================================

-- Ver triggers en la tabla
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tb_as_sis_act';

-- Ver constraints existentes
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'tb_as_sis_act'::regclass;

-- ============================================
-- RESUMEN DE RESULTADOS ESPERADOS
-- ============================================
/*

DESPUÉS DE EJECUTAR TODOS LOS PASOS:

1. PASO 1: Debería devolver 0 filas (sin duplicados)
2. PASO 5: Debería devolver 0 filas (confirmación)
3. Tu aplicación debería:
   - Crear actividades sin duplicarlas
   - Editar actividades sin errores
   - Funcionar normalmente

Si algo sale mal, consulta GUIA_SOLUCION_DUPLICADOS.md

*/
