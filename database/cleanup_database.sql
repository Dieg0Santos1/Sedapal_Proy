-- Limpieza de base de datos SEDAPAL
-- Este script eliminará todas las actividades y todos los usuarios excepto asantosarevalo@gmail.com

BEGIN;

-- 1. Eliminar relaciones de actividades primero (por foreign keys)
DELETE FROM tb_cambios_fecha;
DELETE FROM tb_usuario_actividades;
DELETE FROM tb_admin_actividades;
DELETE FROM tb_entregables;

-- 2. Eliminar todas las actividades
DELETE FROM tb_actividades;

-- 3. Eliminar relaciones de admin-sistemas
DELETE FROM tb_admin_sistemas WHERE id_admin IN (
    SELECT id_usuario FROM tb_usuarios WHERE email != 'asantosarevalo@gmail.com'
);

-- 4. Eliminar todos los usuarios excepto asantosarevalo@gmail.com
DELETE FROM tb_usuarios WHERE email != 'asantosarevalo@gmail.com';

COMMIT;

-- Verificar los datos restantes
SELECT 'Usuarios restantes:' as mensaje;
SELECT id_usuario, email, nombre, apellido, rol FROM tb_usuarios;

SELECT 'Actividades restantes:' as mensaje;
SELECT COUNT(*) as total_actividades FROM tb_actividades;
