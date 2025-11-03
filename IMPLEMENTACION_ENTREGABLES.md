# Implementación de Sistema de Entregables

## Resumen
Se ha implementado un sistema completo para la gestión de archivos entregables en las actividades del sistema SEDAPAL.

## Características Implementadas

### 🎯 Funcionalidades

#### Para Usuarios:
- ✅ **Subir Entregables**: Modal con drag & drop y selector de archivos
- ✅ Soporte para cualquier tipo de archivo (PDF, Word, Excel, imágenes, etc.)
- ✅ Vista previa del archivo seleccionado con tamaño
- ✅ Mensajes de éxito y error
- ✅ Animación con confetti al subir exitosamente

#### Para Administradores:
- ✅ **Ver Entregables**: Modal que lista todos los archivos subidos
- ✅ **Descargar Archivos**: Botón de descarga individual por archivo
- ✅ **Evaluar Actividades**: Botones para marcar como "Conforme" o "Rechazado"
- ✅ Información detallada: nombre, fecha de subida, tamaño
- ✅ Cambio automático de estado de la actividad según evaluación

#### Para SuperAdministrador:
- ✅ Acceso completo para ver y descargar todos los entregables
- ✅ Mismas funcionalidades que el administrador

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
1. **`src/components/UploadModal.tsx`**
   - Modal para subir archivos con drag & drop
   - Validaciones y manejo de errores
   - Interfaz intuitiva y moderna

2. **`src/components/ViewEntregablesModal.tsx`**
   - Modal para visualizar lista de entregables
   - Funciones de descarga
   - Botones de evaluación (Conforme/Rechazado)

3. **`database/create_entregables.sql`**
   - Script SQL para crear tabla `tb_entregables`
   - Políticas de seguridad para Supabase Storage
   - Triggers para limpieza automática

4. **`IMPLEMENTACION_ENTREGABLES.md`**
   - Este archivo de documentación

### Archivos Modificados:
1. **`src/services/api.ts`**
   - Nuevo tipo `Entregable`
   - Nuevo servicio `entregablesService` con funciones:
     - `upload()`: Subir archivo
     - `getByActividad()`: Obtener entregables por actividad
     - `download()`: Descargar archivo
     - `getPublicUrl()`: Obtener URL pública
     - `delete()`: Eliminar entregable

2. **`src/pages/MisActividadesUsuario.tsx`**
   - Integración de UploadModal
   - Función `handleUpload()` para subir archivos
   - Estado para controlar modal y actividad seleccionada

3. **`src/pages/MisActividadesAdmin.tsx`**
   - Integración de ViewEntregablesModal
   - Función `handleDownloadEntregable()` para descargar
   - Función `handleChangeActivityStatus()` para evaluar
   - Carga dinámica de entregables al abrir modal

## 🚀 Pasos de Configuración en Supabase

### 1. Crear Tabla en Base de Datos
Ejecuta el script SQL en el editor de Supabase:

```bash
# Ir a: SQL Editor en Supabase Dashboard
# Copiar y ejecutar: database/create_entregables.sql
```

### 2. Crear Bucket de Storage

1. Ve a **Storage** en el panel de Supabase
2. Haz clic en **"New bucket"**
3. Configura:
   - **Name**: `archivos-actividades`
   - **Public**: ❌ No (privado)
   - **File size limit**: 50 MB (o según necesidad)
4. Haz clic en **"Create bucket"**

### 3. Configurar Políticas de Seguridad (RLS)

#### Opción A: Manual (Interfaz)
1. Ve a **Storage** → **Policies** → `archivos-actividades`
2. Crea las siguientes políticas usando el script SQL proporcionado

#### Opción B: SQL Editor
Las políticas ya están incluidas en el archivo `create_entregables.sql`

### 4. Verificar Permisos

Asegúrate de que la tabla tenga los permisos correctos:

```sql
-- Verificar permisos
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'tb_entregables';
```

## 📊 Estructura de la Tabla

```sql
tb_entregables (
    id                 SERIAL PRIMARY KEY,
    id_actividad       INTEGER NOT NULL,
    nombre_archivo     VARCHAR(255) NOT NULL,
    ruta_archivo       VARCHAR(500) NOT NULL,
    tamaño_archivo     BIGINT,
    subido_por         INTEGER NOT NULL,
    fecha_subida       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## 🔄 Flujo de Trabajo

### Usuario
1. Entra a "Mis Actividades"
2. Hace clic en "Subir Entregables" para una actividad
3. Arrastra o selecciona un archivo
4. Confirma la subida
5. Recibe confirmación visual (confetti + mensaje)

### Administrador
1. Entra a "Mis Actividades"
2. Hace clic en "Ver Entregables" para una actividad
3. Ve la lista de archivos subidos con detalles
4. Puede descargar cualquier archivo
5. Puede marcar la actividad como "Conforme" o "Rechazado"
6. El estado de la actividad se actualiza automáticamente

## 🎨 Cambios en la UI

### Columna "Entregables" agregada en:
- ✅ `MisActividadesAdmin` (entre "Estado" y "Acciones")
- ✅ `MisActividadesUsuario` (reemplaza "Cumplimiento" y "Acción")

### Estados de Actividad:
Ahora las actividades tienen dos campos de evaluación:
- **`estado_actividad`**: pendiente | reprogramado | completado
- **`evaluacion`**: pendiente | conforme | no conforme

## 🧪 Pruebas Recomendadas

1. **Subir archivo como usuario**
   - Probar drag & drop
   - Probar selector de archivos
   - Intentar diferentes formatos (PDF, DOCX, XLSX, PNG, etc.)
   - Verificar límite de tamaño

2. **Ver y descargar como admin**
   - Verificar que se muestren todos los archivos
   - Descargar archivos y verificar integridad
   - Probar con múltiples entregables

3. **Cambiar estado de actividad**
   - Marcar como "Conforme" y verificar cambio
   - Marcar como "Rechazado" y verificar cambio
   - Intentar cambiar estado sin entregables

4. **Verificar permisos**
   - Usuario solo ve sus actividades
   - Admin ve todas las actividades de sus sistemas
   - SuperAdmin ve todas las actividades

## 🔐 Seguridad

- ✅ Storage privado (no acceso público directo)
- ✅ RLS (Row Level Security) habilitado
- ✅ Validación de permisos por rol
- ✅ Foreign keys para integridad referencial
- ✅ Limpieza automática de archivos huérfanos

## 📝 Notas Importantes

1. **Límite de tamaño**: Por defecto 50MB, ajustar según necesidad
2. **Formatos permitidos**: Todos (configurable si se necesita restricción)
3. **Política de RLS**: Simplificada para pruebas, ajustar según seguridad requerida
4. **Storage path**: `entregables/{id_actividad}/{timestamp}_{nombre_archivo}`

## 🐛 Troubleshooting

### Error: "Bucket not found"
- Verificar que el bucket `archivos-actividades` exista
- Verificar el nombre exacto (case-sensitive)

### Error: "Permission denied"
- Verificar políticas RLS en Storage
- Verificar que el usuario tenga una actividad asignada

### Error al descargar
- Verificar que el archivo exista en storage
- Verificar políticas de lectura

### Error al subir
- Verificar límite de tamaño del bucket
- Verificar formato del archivo
- Verificar conexión con Supabase

## 🔄 Próximos Pasos Opcionales

1. **Historial de cambios**: Registrar quién descargó qué archivo y cuándo
2. **Múltiples archivos**: Permitir subir varios archivos a la vez
3. **Preview**: Vista previa de PDFs e imágenes sin descargar
4. **Notificaciones**: Email cuando se sube un entregable
5. **Versionado**: Permitir subir nuevas versiones del mismo archivo
6. **Comentarios**: Permitir que admin deje comentarios en los entregables

## ✅ Checklist de Implementación

- [x] Crear servicio de entregables en api.ts
- [x] Crear componente UploadModal
- [x] Crear componente ViewEntregablesModal
- [x] Integrar en MisActividadesUsuario
- [x] Integrar en MisActividadesAdmin
- [x] Crear script SQL para tabla
- [ ] Ejecutar script en Supabase
- [ ] Crear bucket de storage
- [ ] Configurar políticas RLS
- [ ] Probar flujo completo
- [ ] Documentar para el equipo

## 📞 Soporte

Si encuentras algún problema o tienes preguntas sobre la implementación, revisa:
1. Este documento
2. Comentarios en el código
3. Logs de la consola del navegador
4. Logs de Supabase
