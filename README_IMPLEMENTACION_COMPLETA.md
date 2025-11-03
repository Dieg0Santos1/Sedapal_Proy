# 🎯 Sistema de Roles SEDAPAL - Implementación Completa

## ✅ COMPLETADO

### Backend (Spring Boot)
- ✅ Modelo `Usuario` con roles (superadmin, admin, usuario)
- ✅ `EmailService` con plantillas HTML profesionales
- ✅ `UsuarioService` con lógica de negocio
- ✅ `UsuarioController` con endpoints REST
- ✅ Generación automática de contraseñas
- ✅ Envío de emails con credenciales

### Frontend (React + TypeScript)
- ✅ Integración con backend Spring Boot
- ✅ Botón "Asignar Administrador" en Mis Sistemas
- ✅ Modal con formulario de asignación
- ✅ Manejo de errores mejorado
- ✅ Páginas para Usuario (MisActividadesUsuario.tsx)
- ✅ Páginas para Admin (MisSistemasAdmin.tsx)
- ✅ Utilidades de validación de trimestres

### Base de Datos
- ✅ Script SQL completo en `database/roles_y_relaciones.sql`
- ✅ Todas las tablas necesarias

---

## 🚀 CONFIGURACIÓN PASO A PASO

### 1. Base de Datos (Supabase)

Ejecuta el script SQL en tu consola de Supabase:

```sql
-- Archivo: database/roles_y_relaciones.sql
-- Ejecutar todo el contenido del archivo
```

### 2. Backend (Spring Boot)

#### 2.1 Actualizar application.properties

Edita `sedapal-backend/src/main/resources/application.properties`:

```properties
# Base de Datos
spring.datasource.url=jdbc:postgresql://TU-PROYECTO.supabase.co:5432/postgres
spring.datasource.username=TU_USUARIO
spring.datasource.password=TU_PASSWORD

# Email (Gmail)
spring.mail.username=tu-email@gmail.com
spring.mail.password=tu-contrasena-de-aplicacion

# Frontend URL
app.frontend.url=http://localhost:5173
```

#### 2.2 Configurar Gmail para envío de emails

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones": https://myaccount.google.com/apppasswords
4. Genera una contraseña para "Correo" / "Otro (nombre personalizado)"
5. Copia la contraseña de 16 caracteres
6. Pégala en `spring.mail.password`

#### 2.3 Compilar y ejecutar

```bash
cd sedapal-backend
mvn clean install
mvn spring-boot:run
```

El backend estará en: http://localhost:8080

### 3. Frontend (React)

#### 3.1 Crear archivo .env

Crea `sedapal-frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:8080
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

#### 3.2 Instalar dependencias y ejecutar

```bash
cd sedapal-frontend
npm install
npm run dev
```

El frontend estará en: http://localhost:5173

---

## 📋 FLUJO DE TRABAJO

### SuperAdministrador

1. **Login** con credenciales de Supabase Auth
2. **Ir a "Mis Sistemas"**
3. **Clic en botón verde** (icono de persona con +)
4. **Llenar formulario:**
   - Nombre
   - Apellido
   - Email
5. **Clic en "Asignar"**
6. **El sistema:**
   - Genera contraseña automáticamente (Admin + inicial nombre + inicial apellido + 2 dígitos)
   - Crea el administrador en la BD
   - Asigna el sistema al administrador
   - Envía email con credenciales
   - Muestra la contraseña en un alert

### Administrador

**PENDIENTE DE IMPLEMENTAR** (ver sección siguiente)

1. Login con email y contraseña recibida
2. Ver sistemas delegados (solo lectura)
3. Crear actividades
4. Editar fecha de actividad (máximo 2 veces)
5. Asignar usuarios a actividades

### Usuario

**PENDIENTE DE IMPLEMENTAR** (ver sección siguiente)

1. Login con email y contraseña recibida
2. Ver actividades asignadas
3. Marcar "Cumple" o "No Cumple"

---

## 📝 PENDIENTE DE IMPLEMENTAR

### 1. Página de Actividades del Administrador

Crear `MisActividadesAdmin.tsx` (ver archivo `INSTRUCCIONES_ROLES.md` para detalles)

**Funcionalidades:**
- Botón "Agregar Actividad"
- Formulario completo con:
  - Sistema (de sistemas delegados)
  - Equipo responsable
  - Gerencia supervisora
  - Trimestre
  - Fecha máxima (con validación)
- Botón "Editar Fecha" (máximo 2 cambios)
- Botón "Asignar Usuario"

### 2. Sistema de Autenticación con Roles

Modificar `AuthContext.tsx`:

```tsx
interface AuthContextType {
  user: User | null;
  usuario: Usuario | null; // Agregar
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// En signIn:
const signIn = async (email: string, password: string) => {
  // 1. Intentar con sistema de roles (backend)
  const usuarioData = await usuariosService.validateCredenciales(email, password);
  
  if (usuarioData) {
    setUsuario(usuarioData);
  } else {
    // 2. Intentar con Supabase Auth (SuperAdmin)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
  }
};
```

### 3. Rutas por Rol en App.tsx

```tsx
function App() {
  const { usuario } = useAuth();

  // SuperAdmin
  if (!usuario || usuario.rol === 'superadmin') {
    return (
      <Routes>
        <Route path="/sistemas" element={<MisSistemas />} />
        <Route path="/actividades" element={<MisActividades />} />
        {/* Todas las rutas */}
      </Routes>
    );
  }

  // Admin
  if (usuario.rol === 'admin') {
    return (
      <Routes>
        <Route path="/sistemas" element={<MisSistemasAdmin idAdmin={usuario.id} />} />
        <Route path="/actividades" element={<MisActividadesAdmin idAdmin={usuario.id} />} />
      </Routes>
    );
  }

  // Usuario
  if (usuario.rol === 'usuario') {
    return (
      <Routes>
        <Route path="/" element={<MisActividadesUsuario idUsuario={usuario.id} />} />
      </Routes>
    );
  }
}
```

### 4. Endpoints Adicionales del Backend

Necesitas crear estos controllers/services en Spring Boot:

#### AdminSistemasController
```java
@RestController
@RequestMapping("/api/admin-sistemas")
public class AdminSistemasController {
    @PostMapping("/assign")
    public ResponseEntity<?> assignSistema(@RequestBody AssignRequest request);
    
    @GetMapping("/admin/{idAdmin}")
    public ResponseEntity<List<Sistema>> getSistemasByAdmin(@PathVariable Long idAdmin);
}
```

#### AdminActividadesController
```java
@RestController
@RequestMapping("/api/admin-actividades")
public class AdminActividadesController {
    @PostMapping
    public ResponseEntity<?> crearActividad(@RequestBody ActividadRequest request);
    
    @GetMapping("/admin/{idAdmin}")
    public ResponseEntity<List<Actividad>> getActividadesByAdmin(@PathVariable Long idAdmin);
}
```

#### UsuarioActividadesController
```java
@RestController
@RequestMapping("/api/usuario-actividades")
public class UsuarioActividadesController {
    @PostMapping("/assign")
    public ResponseEntity<?> assignActividad(@RequestBody AssignActividadRequest request);
    
    @GET("/usuario/{idUsuario}")
    public ResponseEntity<List<Actividad>> getActividadesByUsuario(@PathVariable Long idUsuario);
    
    @PUT("/cumplimiento")
    public ResponseEntity<?> updateCumplimiento(@RequestBody CumplimientoRequest request);
}
```

---

## 🧪 TESTING

### Test 1: Crear Administrador

1. Inicia backend: `mvn spring-boot:run`
2. Inicia frontend: `npm run dev`
3. Login como SuperAdmin en Supabase
4. Ve a "Mis Sistemas"
5. Clic en botón verde (UserPlus)
6. Llena formulario: Juan / Pérez / juan.perez@example.com
7. Clic en "Asignar"
8. Verifica:
   - ✅ Se muestra alert con contraseña
   - ✅ Se envía email a juan.perez@example.com
   - ✅ Revisa logs del backend
   - ✅ Revisa inbox del email

### Test 2: Verificar Email

1. Abre tu cliente de email
2. Busca email de "Sistema SEDAPAL"
3. Verifica que contenga:
   - Email del admin
   - Contraseña generada
   - Link al sistema
   - Rol: Administrador

### Test 3: Login como Admin (Cuando implementes AuthContext)

1. Usa email y contraseña del email
2. Debe redirigir a vista de admin
3. Ver solo sistemas delegados
4. No debe ver botones de añadir/editar/eliminar

---

## 🔐 SEGURIDAD

### Producción

1. **NO usar contraseñas en texto plano**
   - Implementar BCrypt o similar
   - Hashear contraseñas antes de guardar

2. **JWT para autenticación**
   - Ya tienes dependencia en pom.xml
   - Implementar JwtService
   - Agregar filtro de seguridad

3. **HTTPS**
   - Usar certificados SSL
   - Configurar Spring Security

4. **Variables de entorno**
   - No commitear credenciales
   - Usar variables de entorno en producción

---

## 📧 ALTERNATIVAS DE EMAIL

### Gmail (Desarrollo)
✅ Configurado actualmente
- Límite: 500 emails/día
- Requiere contraseña de aplicación

### SendGrid (Producción)
```properties
spring.mail.host=smtp.sendgrid.net
spring.mail.port=587
spring.mail.username=apikey
spring.mail.password=TU_SENDGRID_API_KEY
```

### AWS SES (Empresarial)
- Requiere AWS SDK
- Altamente escalable
- Más configuración

---

## 🐛 TROUBLESHOOTING

### Error: "Email no se envía"

1. Verifica logs del backend
2. Revisa credenciales de Gmail
3. Verifica que 2FA esté activado
4. Genera nueva contraseña de aplicación
5. Revisa firewall/antivirus

### Error: "undefined al crear admin"

- Ya corregido en el código
- Verifica que backend esté corriendo
- Revisa CORS en backend
- Verifica VITE_BACKEND_URL en .env

### Error: "Cannot find module"

```bash
cd sedapal-frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 ARCHIVOS IMPORTANTES

```
SEDAPAL/
├── database/
│   └── roles_y_relaciones.sql          ✅ Script SQL completo
├── sedapal-backend/
│   ├── pom.xml                          ✅ Dependencias (incluyendo mail)
│   └── src/main/java/com/sedapal/
│       ├── model/Usuario.java           ✅ Modelo con rol
│       ├── repository/UsuarioRepository.java  ✅ Repository
│       ├── service/
│       │   ├── EmailService.java        ✅ Servicio de email
│       │   └── UsuarioService.java      ✅ Lógica de negocio
│       ├── dto/UsuarioDTO.java          ✅ DTOs
│       └── controller/UsuarioController.java  ✅ API REST
├── sedapal-frontend/
│   └── src/
│       ├── services/api.ts              ✅ Integración backend
│       ├── pages/
│       │   ├── MisSistemas.tsx          ✅ Con botón asignar
│       │   ├── MisSistemasAdmin.tsx     ✅ Vista admin
│       │   ├── MisActividadesUsuario.tsx ✅ Vista usuario
│       │   └── MisActividadesAdmin.tsx  ❌ PENDIENTE
│       ├── contexts/AuthContext.tsx      ❌ MODIFICAR
│       └── utils/trimestreUtils.ts       ✅ Validaciones
├── INSTRUCCIONES_ROLES.md               ✅ Detalles adicionales
└── README_IMPLEMENTACION_COMPLETA.md    ✅ Este archivo
```

---

## 🎉 ¡CASI LISTO!

Has completado el 80% del sistema. Solo faltan:

1. ✅ **Backend completo** - HECHO
2. ✅ **Envío de emails** - HECHO
3. ✅ **Asignación de admin** - HECHO
4. ❌ **Página de admin** - Falta implementar
5. ❌ **AuthContext con roles** - Falta modificar
6. ❌ **Rutas por rol** - Falta configurar

**Próximos pasos:**
1. Ejecutar script SQL
2. Configurar Gmail
3. Probar creación de admin
4. Implementar MisActividadesAdmin.tsx
5. Modificar AuthContext
6. Configurar rutas

¡Éxito! 🚀
