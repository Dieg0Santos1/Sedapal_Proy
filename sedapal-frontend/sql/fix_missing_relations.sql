-- ============================================
-- DIAGNÓSTICO DE RELACIONES FALTANTES
-- ============================================

-- 1. Ver todas las actividades que NO tienen relación en tb_as_sis_act
SELECT 
    a.id_actividad,
    a.nombre_actividad,
    a.trimestre,
    a.estado_actividad
FROM tb_actividades a
LEFT JOIN tb_as_sis_act r ON a.id_actividad = r.id_actividad
WHERE r.id_actividad IS NULL;

-- 2. Ver todas las actividades CON sus relaciones
SELECT 
    a.id_actividad,
    a.nombre_actividad,
    r.id_sistema,
    s.abrev as sistema,
    r.id_equipo,
    e.desc_equipo as equipo,
    r.id_gerencia
FROM tb_actividades a
LEFT JOIN tb_as_sis_act r ON a.id_actividad = r.id_actividad
LEFT JOIN tb_sistemas s ON r.id_sistema = s.id
LEFT JOIN tb_equipos e ON r.id_equipo = e.id_equipo
ORDER BY a.id_actividad;

-- ============================================
-- CREAR RELACIONES FALTANTES
-- ============================================
-- IMPORTANTE: Ejecuta esto solo después de revisar el diagnóstico

-- 3. Para cada actividad sin relación, necesitas crearla manualmente
-- Ejemplo para la actividad con id_actividad = 1:

-- INSERT INTO tb_as_sis_act (id_actividad, id_sistema, id_equipo, id_gerencia, cod_cat_int)
-- VALUES (
--     1,                    -- id_actividad (el ID de la actividad sin relación)
--     1,                    -- id_sistema (el ID del sistema que corresponde)
--     1,                    -- id_equipo (el ID del equipo responsable)
--     1,                    -- id_gerencia (el ID de la gerencia, 1 = GENERAL)
--     1                     -- cod_cat_int (código de categoría, default 1)
-- );

-- ============================================
-- PLANTILLA PARA CREAR RELACIONES MÚLTIPLES
-- ============================================
-- Usa esta plantilla y modifica los valores según tus actividades:

/*
INSERT INTO tb_as_sis_act (id_actividad, id_sistema, id_equipo, id_gerencia, cod_cat_int)
VALUES 
    (1, 1, 1, 1, 1),    -- Actividad 1 → Sistema 1, Equipo 1
    (2, 2, 2, 1, 1),    -- Actividad 2 → Sistema 2, Equipo 2
    (3, 3, 3, 1, 1);    -- Actividad 3 → Sistema 3, Equipo 3
*/

-- ============================================
-- CONSULTAS AUXILIARES
-- ============================================

-- 4. Ver todos los sistemas disponibles
SELECT id, abrev, desc_sistema FROM tb_sistemas ORDER BY id;

-- 5. Ver todos los equipos disponibles
SELECT id_equipo, desc_equipo, id_gerencia FROM tb_equipos ORDER BY id_equipo;

-- 6. Ver todas las gerencias disponibles
SELECT DISTINCT id_gerencia FROM tb_equipos ORDER BY id_gerencia;

-- ============================================
-- VERIFICACIÓN POST-CREACIÓN
-- ============================================

-- 7. Verificar que todas las actividades tengan relación
SELECT 
    COUNT(CASE WHEN r.id_actividad IS NULL THEN 1 END) as sin_relacion,
    COUNT(CASE WHEN r.id_actividad IS NOT NULL THEN 1 END) as con_relacion,
    COUNT(*) as total
FROM tb_actividades a
LEFT JOIN tb_as_sis_act r ON a.id_actividad = r.id_actividad;

-- El resultado debería mostrar:
-- sin_relacion: 0
-- con_relacion: (número de actividades)
-- total: (número de actividades)
