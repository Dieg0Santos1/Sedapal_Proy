-- Limpieza general de datos de prueba (mantener únicamente a los superadmin)
-- Ejecuta este script con un usuario con privilegios (por ejemplo, desde el SQL editor de Supabase)

BEGIN;

-- 1) Relaciones dependientes de actividades/usuarios
DELETE FROM tb_entregables;           -- Dispara trigger para limpiar storage si estaba configurado
DELETE FROM tb_cambios_fecha;
DELETE FROM tb_usuario_actividades;
DELETE FROM tb_admin_actividades;

-- 2) Relaciones de actividades con sistemas/equipos
DELETE FROM tb_as_sis_act WHERE id_actividad IN (SELECT id_actividad FROM tb_actividades);

-- 3) Actividades
DELETE FROM tb_actividades;

-- 4) Relaciones de usuario-equipo (dejamos solo superadmins)
DELETE FROM tb_usuario_equipo WHERE id_usuario IN (
  SELECT id_usuario FROM tb_usuarios WHERE rol <> 'superadmin'
);

-- 5) Asignaciones de sistemas a admins (eliminamos asignaciones de no-superadmins)
DELETE FROM tb_admin_sistemas WHERE id_admin IN (
  SELECT id_usuario FROM tb_usuarios WHERE rol <> 'superadmin'
);

-- 6) Usuarios (dejamos únicamente superadmins)
DELETE FROM tb_usuarios WHERE rol <> 'superadmin';

COMMIT;

-- Verificaciones rápidas
SELECT 'Usuarios (solo superadmins deben quedar):' AS info;
SELECT id_usuario, nombre, apellido, email, rol FROM tb_usuarios ORDER BY id_usuario;

SELECT 'Actividades:' AS info;
SELECT COUNT(*) AS total_actividades FROM tb_actividades;

SELECT 'Asignaciones usuario-actividad:' AS info;
SELECT COUNT(*) AS total_asignaciones FROM tb_usuario_actividades;

SELECT 'Entregables:' AS info;
SELECT COUNT(*) AS total_entregables FROM tb_entregables;
