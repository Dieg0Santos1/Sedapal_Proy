-- ============================================
-- DIAGNÓSTICO DE DUPLICADOS
-- ============================================

-- 1. Ver actividades duplicadas en la tabla de relaciones
SELECT 
    id_actividad, 
    id_sistema, 
    id_equipo,
    COUNT(*) as cantidad
FROM tb_as_sis_act
GROUP BY id_actividad, id_sistema, id_equipo
HAVING COUNT(*) > 1;

-- 2. Ver detalles completos de los duplicados
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
-- LIMPIAR DUPLICADOS (CUIDADO!)
-- ============================================

-- 3. Eliminar duplicados manteniendo solo el primer registro
-- IMPORTANTE: Ejecutar esto solo después de revisar los duplicados
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
-- PREVENIR DUPLICADOS FUTUROS
-- ============================================

-- 4. Agregar constraint UNIQUE para prevenir duplicados futuros
-- Nota: Solo ejecutar después de limpiar los duplicados existentes
ALTER TABLE tb_as_sis_act 
ADD CONSTRAINT uq_actividad_sistema_equipo 
UNIQUE (id_actividad, id_sistema, id_equipo);

-- ============================================
-- VERIFICACIÓN POST-CORRECCIÓN
-- ============================================

-- 5. Verificar que no hay duplicados
SELECT 
    id_actividad, 
    id_sistema, 
    id_equipo,
    COUNT(*) as cantidad
FROM tb_as_sis_act
GROUP BY id_actividad, id_sistema, id_equipo
HAVING COUNT(*) > 1;

-- Si el query anterior no devuelve filas, los duplicados han sido eliminados correctamente

-- 6. Ver todas las actividades con sus relaciones
SELECT 
    a.id_actividad,
    a.nombre_actividad,
    r.id_sistema,
    s.abrev as sistema,
    r.id_equipo,
    e.desc_equipo as equipo
FROM tb_actividades a
LEFT JOIN tb_as_sis_act r ON a.id_actividad = r.id_actividad
LEFT JOIN tb_sistemas s ON r.id_sistema = s.id
LEFT JOIN tb_equipos e ON r.id_equipo = e.id_equipo
ORDER BY a.id_actividad;
