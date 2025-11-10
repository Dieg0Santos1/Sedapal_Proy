-- Limpia SOLO actividades y sus relaciones (conserva usuarios y sistemas)
BEGIN;

-- 1) Entregables (archivos) de actividades
DELETE FROM tb_entregables WHERE id_actividad IN (SELECT id_actividad FROM tb_actividades);

-- 2) Cambios de fecha
DELETE FROM tb_cambios_fecha WHERE id_actividad IN (SELECT id_actividad FROM tb_actividades);

-- 3) Asignaciones usuario-actividad
DELETE FROM tb_usuario_actividades WHERE id_actividad IN (SELECT id_actividad FROM tb_actividades);

-- 4) Relación admin-actividad
DELETE FROM tb_admin_actividades WHERE id_actividad IN (SELECT id_actividad FROM tb_actividades);

-- 5) Relación sistema-actividad-equipo
DELETE FROM tb_as_sis_act WHERE id_actividad IN (SELECT id_actividad FROM tb_actividades);

-- 6) Actividades
DELETE FROM tb_actividades;

COMMIT;

-- Verificación
SELECT 'Actividades:' AS info; SELECT COUNT(*) AS total_actividades FROM tb_actividades;
