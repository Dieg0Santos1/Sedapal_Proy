# Guía para Solucionar el Problema de Duplicados en Actividades

## 🔍 Problema Identificado

Tienes dos problemas relacionados en tu aplicación:

1. **Duplicación al crear**: Cuando agregas una nueva actividad, se crean dos registros con los mismos campos en la tabla `tb_as_sis_act`
2. **Error al editar**: Mensaje "JSON object requested, multiple (or no) rows returned" porque existen registros duplicados

## 🎯 Causa Raíz

El problema está en la tabla de relaciones `tb_as_sis_act` que:
- No tiene una restricción UNIQUE para prevenir duplicados
- Puede tener triggers o políticas RLS (Row Level Security) que causan inserciones dobles

## ✅ Solución Implementada

### 1. Cambios en el Frontend (✓ Completado)

He modificado `src/services/api.ts` para:

#### En el método `create()`:
- ✅ Removido `.single()` para evitar errores con múltiples filas
- ✅ Agregada verificación antes de insertar en `tb_as_sis_act` para prevenir duplicados
- ✅ Mejorado manejo de errores con logs detallados

#### En el método `update()`:
- ✅ Removido `.single()` que causaba el error
- ✅ Agregado manejo robusto para múltiples filas
- ✅ Advertencia en consola si detecta duplicados

### 2. Cambios en la Base de Datos (⚠️ Requiere Acción)

Debes ejecutar los siguientes pasos en tu base de datos Supabase:

## 📋 Pasos para Ejecutar

### Paso 1: Diagnosticar el Problema

Abre el SQL Editor en Supabase y ejecuta:

```sql
-- Ver si hay duplicados
SELECT 
    id_actividad, 
    id_sistema, 
    id_equipo,
    COUNT(*) as cantidad
FROM tb_as_sis_act
GROUP BY id_actividad, id_sistema, id_equipo
HAVING COUNT(*) > 1;
```

Si este query devuelve filas, tienes duplicados.

### Paso 2: Ver Detalles de los Duplicados

```sql
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
```

### Paso 3: Eliminar Duplicados

⚠️ **CUIDADO**: Este paso eliminará registros. Revisa primero con los pasos anteriores.

```sql
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
```

### Paso 4: Agregar Restricción UNIQUE

Esto previene futuros duplicados:

```sql
ALTER TABLE tb_as_sis_act 
ADD CONSTRAINT uq_actividad_sistema_equipo 
UNIQUE (id_actividad, id_sistema, id_equipo);
```

### Paso 5: Verificar RLS Policies y Triggers

En Supabase, revisa:

1. **Políticas RLS** en la tabla `tb_as_sis_act`:
   - Ve a "Authentication" → "Policies"
   - Busca políticas que puedan estar causando inserciones dobles

2. **Triggers** en la tabla `tb_as_sis_act`:
   - Ejecuta este query para ver triggers:

```sql
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tb_as_sis_act';
```

3. **Si encuentras triggers sospechosos**, documenta su comportamiento y considera modificarlos.

### Paso 6: Verificación Final

Después de limpiar duplicados y agregar la restricción:

```sql
-- No debería devolver filas
SELECT 
    id_actividad, 
    id_sistema, 
    id_equipo,
    COUNT(*) as cantidad
FROM tb_as_sis_act
GROUP BY id_actividad, id_sistema, id_equipo
HAVING COUNT(*) > 1;
```

## 🧪 Prueba de la Solución

1. **Limpia la base de datos** (ejecutando los pasos 3 y 4)
2. **Recarga tu aplicación frontend**
3. **Intenta crear una nueva actividad**
4. **Verifica que solo se cree UN registro**
5. **Intenta editar una actividad existente**
6. **Confirma que no haya errores**

## 🔧 Cambios Realizados en el Código

### `src/services/api.ts`

**Antes:**
```typescript
.select()
.single(); // ❌ Esto causaba errores con duplicados
```

**Después:**
```typescript
.select(); // ✅ Maneja múltiples filas correctamente

// Manejar el caso de múltiples filas devueltas
const actividadCreada = Array.isArray(nuevaActividad) ? nuevaActividad[0] : nuevaActividad;
```

**Nueva verificación antes de insertar:**
```typescript
// Verificar si ya existe una relación (prevenir duplicados)
const { data: relacionExistente } = await supabase
  .from('tb_as_sis_act')
  .select('id')
  .eq('id_actividad', actividadCreada.id_actividad)
  .eq('id_sistema', actividad.id_sistema)
  .eq('id_equipo', actividad.id_equipo || 1)
  .maybeSingle();

// Solo insertar si no existe la relación
if (!relacionExistente) {
  // ... insertar
}
```

## 📊 Archivos Modificados

- ✅ `src/services/api.ts` - Métodos `create()` y `update()`
- ✅ `sql/fix_duplicates.sql` - Script SQL para diagnóstico y limpieza
- ✅ `GUIA_SOLUCION_DUPLICADOS.md` - Este documento

## ❓ Preguntas Frecuentes

### ¿Puedo solo ejecutar el código frontend sin tocar la base de datos?

Sí, el código ahora previene nuevos duplicados, pero los existentes seguirán causando el error al editar. Recomiendo limpiar la base de datos.

### ¿Qué pasa si no quiero eliminar los duplicados manualmente?

Los cambios en el código ahora manejan duplicados mejor, pero la restricción UNIQUE no se puede agregar hasta que limpies los duplicados existentes.

### ¿Cómo sé si el problema está resuelto?

Cuando puedas:
1. Crear una actividad sin que se duplique
2. Editar una actividad sin recibir errores
3. Ver solo un registro por actividad en `tb_as_sis_act`

## 🆘 Si los Problemas Persisten

1. Revisa la consola del navegador para logs detallados
2. Verifica las políticas RLS en Supabase
3. Busca triggers que puedan estar duplicando inserciones
4. Contacta al equipo de soporte con los logs

## 📝 Notas Adicionales

- La restricción UNIQUE es **opcional pero muy recomendada**
- Los cambios en el código son **retrocompatibles**
- No afectan otras partes de la aplicación
