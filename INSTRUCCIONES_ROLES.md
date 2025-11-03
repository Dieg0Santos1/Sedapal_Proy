# Sistema de Roles - SEDAPAL

## ✅ Implementado

### 1. Base de Datos
- ✅ Tablas creadas en `database/roles_y_relaciones.sql`
- ✅ `tb_usuarios` - Tabla de usuarios con roles
- ✅ `tb_admin_sistemas` - Relación administradores-sistemas
- ✅ `tb_admin_actividades` - Relación administradores-actividades
- ✅ `tb_usuario_actividades` - Relación usuarios-actividades
- ✅ `tb_cambios_fecha` - Historial de cambios de fecha (máximo 2)

**Ejecutar en Supabase:**
```sql
-- Ejecutar el archivo database/roles_y_relaciones.sql en tu base de datos
```

### 2. API Services (api.ts)
- ✅ `usuariosService` - Gestión de usuarios
- ✅ `adminSistemasService` - Asignación de sistemas a admins
- ✅ `usuarioActividadesService` - Asignación de actividades a usuarios
- ✅ `adminActividadesService` - Actividades creadas por admins
- ✅ `cambiosFechaService` - Control de cambios de fecha

### 3. Páginas Creadas
- ✅ `MisSistemasAdmin.tsx` - Vista de sistemas delegados (solo lectura)
- ✅ `MisActividadesUsuario.tsx` - Actividades del usuario con botones Cumple/No Cumple
- ✅ `MisSistemas.tsx` - Agregado botón "Asignar Administrador"

### 4. Utilidades
- ✅ `utils/trimestreUtils.ts` - Validación de fechas y trimestres

---

## 📝 PENDIENTE DE IMPLEMENTAR

### 1. Página de Actividades del Administrador

Crear `src/pages/MisActividadesAdmin.tsx` con las siguientes características:

**Funcionalidades:**
- Mostrar todas las actividades creadas por el administrador
- Botón "Agregar Actividad" con formulario que incluya:
  - Nombre de actividad
  - Sistema (de los sistemas delegados)
  - Equipo responsable (de tb_equipos)
  - Gerencia supervisora (de tb_gerencia)
  - Trimestre
  - Fecha máxima de entrega (con validación de trimestre)
- Botón "Editar Fecha" (permitir solo 2 cambios):
  - Consultar `cambiosFechaService.getCantidadCambios()`
  - Si tiene menos de 2 cambios: permitir editar sin restricción de trimestre
  - Si ya tiene 2 cambios: deshabilitar el botón
  - Registrar cambio con `cambiosFechaService.registrarCambio()`
- Botón "Asignar Usuario" para cada actividad:
  - Modal con campos: Nombre, Apellido, Email
  - Generar contraseña: `User + inicial_nombre + inicial_apellido + 2_dígitos`
  - Crear usuario con `usuariosService.createUser()`
  - Asignar actividad con `usuarioActividadesService.assign()`

**Ejemplo de estructura:**
```tsx
import { ClipboardList, Plus, Edit2, UserPlus } from 'lucide-react';
import { adminActividadesService, sistemasService, equiposService, usuariosService, usuarioActividadesService, cambiosFechaService } from '../services/api';
import { validarFechaEnTrimestre, getMensajeErrorFechaTrimestre } from '../utils/trimestreUtils';

interface MisActividadesAdminProps {
  idAdmin: number;
}

export default function MisActividadesAdmin({ idAdmin }: MisActividadesAdminProps) {
  // Estados para actividades, sistemas delegados, equipos, gerencias
  // Modal para agregar actividad
  // Modal para editar fecha (con validación de máximo 2 cambios)
  // Modal para asignar usuario
  // Función handleAgregarActividad que:
  //   - Valide fecha con validarFechaEnTrimestre()
  //   - Cree actividad con actividadesService.create()
  //   - Registre que el admin la creó con adminActividadesService.registerActividad()
  // Función handleEditarFecha que:
  //   - Verifique cantidad de cambios con getCantidadCambios()
  //   - Si < 2: permitir cambio sin restricción
  //   - Actualizar actividad
  //   - Registrar cambio con registrarCambio()
  // Función handleAsignarUsuario que:
  //   - Genere contraseña
  //   - Cree usuario
  //   - Asigne actividad
  //   - Muestre credenciales (para enviar por email)
}
```

### 2. Modificar AuthContext para incluir rol

Editar `src/contexts/AuthContext.tsx`:

```tsx
import { usuariosService } from '../services/api';
import type { Usuario } from '../services/api';

interface AuthContextType {
  user: User | null;
  usuario: Usuario | null; // Usuario de tb_usuarios con rol
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// En signIn, después de autenticar:
const signIn = async (email: string, password: string) => {
  // Intentar primero con tb_usuarios (sistema de roles)
  const usuarioData = await usuariosService.validateCredentials(email, password);
  
  if (usuarioData) {
    // Usuario del sistema de roles encontrado
    setUsuario(usuarioData);
    // También autenticar en Supabase Auth si es necesario
  } else {
    // Intentar con Supabase Auth tradicional (para SuperAdmin)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
  }
};
```

### 3. Actualizar App.tsx con rutas por rol

Modificar el enrutamiento según el rol del usuario:

```tsx
import { useAuth } from './contexts/AuthContext';
import MisSistemas from './pages/MisSistemas'; // SuperAdmin
import MisSistemasAdmin from './pages/MisSistemasAdmin'; // Admin
import MisActividadesAdmin from './pages/MisActividadesAdmin'; // Admin
import MisActividadesUsuario from './pages/MisActividadesUsuario'; // Usuario

function App() {
  const { usuario, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  // Redirigir según rol
  if (usuario?.rol === 'superadmin') {
    return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sistemas" element={<MisSistemas />} />
        <Route path="/actividades" element={<MisActividades />} />
        {/* ... más rutas de SuperAdmin */}
      </Routes>
    );
  }

  if (usuario?.rol === 'admin') {
    return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sistemas" element={<MisSistemasAdmin idAdmin={usuario.id_usuario} />} />
        <Route path="/actividades" element={<MisActividadesAdmin idAdmin={usuario.id_usuario} />} />
        {/* Admin NO puede ver /reporte ni otras páginas de SuperAdmin */}
      </Routes>
    );
  }

  if (usuario?.rol === 'usuario') {
    return (
      <Routes>
        <Route path="/" element={<MisActividadesUsuario idUsuario={usuario.id_usuario} />} />
        {/* Usuario SOLO puede ver sus actividades */}
      </Routes>
    );
  }

  return <Navigate to="/login" />;
}
```

### 4. Modificar Login.tsx

Actualizar el componente de login para usar el nuevo sistema de autenticación:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await signIn(email, password);
    // El redireccionamiento se hace automáticamente en App.tsx según el rol
  } catch (error: any) {
    setError('Credenciales incorrectas');
  }
};
```

### 5. Validación de Fecha en Formularios

Al agregar/editar actividades, usar las utilidades de validación:

```tsx
import { validarFechaEnTrimestre, getMensajeErrorFechaTrimestre } from '../utils/trimestreUtils';

const handleFechaChange = (fecha: string) => {
  if (!validarFechaEnTrimestre(fecha, formData.trimestre)) {
    // Solo mostrar error si no es una edición permitida por el admin
    if (cantidadCambios < 2) {
      // Advertir pero permitir (es uno de los 2 cambios permitidos)
      console.warn('Fecha fuera del trimestre, pero es uno de los cambios permitidos');
    } else {
      // Rechazar el cambio
      setError(getMensajeErrorFechaTrimestre(formData.trimestre));
      return;
    }
  }
  setFormData({ ...formData, fecha_maxima_entrega: fecha });
};
```

---

## 🔒 Reglas de Negocio Implementadas

### SuperAdministrador
✅ Puede ver, crear, editar y eliminar sistemas
✅ Puede asignar administradores a sistemas
✅ Puede ver todas las actividades
✅ Tiene acceso completo al dashboard y reportes

### Administrador
✅ Ve solo los sistemas que le fueron delegados (sin poder editarlos)
✅ Puede crear actividades en sus sistemas
✅ Puede editar la fecha de entrega MÁXIMO 2 veces (sin restricción de trimestre en esos 2 cambios)
✅ Puede asignar usuarios a sus actividades
✅ No puede acceder a "Mis Sistemas" (gestión completa)

### Usuario
✅ Ve solo las actividades que le fueron asignadas
✅ No puede editar nada
✅ Solo puede marcar "Cumple" o "No Cumple"
✅ Una vez marcado, no puede cambiar su respuesta
✅ No tiene acceso a "Mis Sistemas" ni otras páginas

---

## 📧 Sistema de Emails (TODO)

Actualmente, las contraseñas se muestran en un `alert()`. Para producción, implementar:

```typescript
// Servicio de email (usar API de correo como SendGrid, AWS SES, etc.)
const enviarCredenciales = async (email: string, nombre: string, contrasena: string, rol: string) => {
  const asunto = rol === 'admin' 
    ? 'Bienvenido como Administrador - SEDAPAL'
    : 'Bienvenido como Usuario - SEDAPAL';
  
  const mensaje = `
    Hola ${nombre},
    
    Se te ha asignado acceso al sistema SEDAPAL con las siguientes credenciales:
    
    Email: ${email}
    Contraseña: ${contrasena}
    Rol: ${rol}
    
    Por favor, cambia tu contraseña al iniciar sesión por primera vez.
    
    Link: https://sedapal-sistema.com/login
  `;
  
  // Implementar envío de email aquí
};
```

---

## ✨ Testing

Después de implementar, probar los siguientes flujos:

1. **SuperAdmin crea Admin:**
   - Login como SuperAdmin
   - Ir a "Mis Sistemas"
   - Clic en botón verde "Asignar Administrador"
   - Ingresar datos y verificar que se crea el admin
   - Verificar que se muestra la contraseña

2. **Admin crea Actividad:**
   - Login con credenciales de Admin
   - Verificar que solo ve sistemas delegados
   - Crear una actividad con fecha en el trimestre correcto
   - Intentar crear actividad con fecha fuera del trimestre (debe rechazar)

3. **Admin edita fecha (máximo 2 veces):**
   - Editar fecha de una actividad (1er cambio)
   - Editar fecha nuevamente (2do cambio)
   - Intentar editar por tercera vez (debe estar deshabilitado)

4. **Admin asigna Usuario:**
   - Clic en "Asignar Usuario" en una actividad
   - Ingresar datos del usuario
   - Verificar que se crea y se muestra la contraseña

5. **Usuario marca cumplimiento:**
   - Login con credenciales de Usuario
   - Verificar que solo ve sus actividades asignadas
   - Marcar "Cumple" o "No Cumple"
   - Verificar que los botones se deshabilitan después de marcar

---

## 🎯 Resumen de Archivos

### ✅ Creados/Modificados
- `database/roles_y_relaciones.sql` ✅
- `src/services/api.ts` ✅ (extendido)
- `src/pages/MisSistemas.tsx` ✅ (agregado botón)
- `src/pages/MisSistemasAdmin.tsx` ✅
- `src/pages/MisActividadesUsuario.tsx` ✅
- `src/utils/trimestreUtils.ts` ✅

### 📝 Pendientes
- `src/pages/MisActividadesAdmin.tsx` (crear completo)
- `src/contexts/AuthContext.tsx` (modificar para roles)
- `src/App.tsx` (actualizar rutas por rol)
- `src/pages/Login.tsx` (usar nuevo sistema auth)

---

## 🚀 Siguiente Paso

1. Ejecutar el script SQL en Supabase
2. Crear la página `MisActividadesAdmin.tsx` siguiendo el ejemplo
3. Modificar `AuthContext.tsx` para incluir roles
4. Actualizar rutas en `App.tsx`
5. Probar todo el flujo

¡Casi terminado! Solo faltan las implementaciones de las páginas de administrador y ajustar el sistema de autenticación. 🎉
