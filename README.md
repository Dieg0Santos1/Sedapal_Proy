# Sistema de Gestión SEDAPAL

Sistema profesional de gestión de actividades y entregables para SEDAPAL, desarrollado con tecnologías modernas.

## 🎨 Colores Corporativos
- **Azul Principal**: #1E3A8A
- **Azul Claro**: #3B82F6
- **Celeste**: #06B6D4
- **Blanco**: #FFFFFF
- **Gris**: #F3F4F6

## 🛠️ Tecnologías

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router DOM
- Supabase Client

### Backend
- Spring Boot 3.2.0
- Java 17
- Spring Security
- Spring Data JPA
- PostgreSQL (Supabase)
- JWT Authentication

## 📋 Requisitos Previos

### Para el Frontend
- Node.js 18+ y npm
- Un navegador moderno

### Para el Backend
- Java 17+
- Maven 3.8+

## 🚀 Configuración del Proyecto

### 1. Configurar Supabase

Para conectar el proyecto a tu base de datos Supabase existente, necesitas:

#### Frontend (.env)
1. Crea un archivo `.env` en la carpeta `sedapal-frontend/`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**¿Dónde encontrar estos valores?**
- Ve a tu proyecto en https://supabase.com/dashboard
- Ve a Settings → API
- Copia el "Project URL" para `VITE_SUPABASE_URL`
- Copia el "anon public" key para `VITE_SUPABASE_ANON_KEY`

#### Backend (application.properties)
Edita el archivo `sedapal-backend/src/main/resources/application.properties`:

```properties
# Configuración de Base de Datos (Supabase)
spring.datasource.url=jdbc:postgresql://db.tu-proyecto.supabase.co:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=tu_password_de_supabase
```

**¿Dónde encontrar estos valores?**
- Ve a tu proyecto en Supabase
- Ve a Settings → Database
- Copia la "Connection string" en modo URI
- Extrae: host, puerto, database, usuario y contraseña

**Formato de la URL:**
```
jdbc:postgresql://[HOST]:[PUERTO]/[DATABASE]
```

Ejemplo:
```
jdbc:postgresql://db.abcdefghijk.supabase.co:5432/postgres
```

### 2. Ejecutar el Frontend

```bash
cd sedapal-frontend
npm install
npm run dev
```

El frontend estará disponible en: http://localhost:5173

### 3. Ejecutar el Backend

```bash
cd sedapal-backend
mvn clean install
mvn spring-boot:run
```

El backend estará disponible en: http://localhost:8080

## 📁 Estructura del Proyecto

```
SEDAPAL/
├── sedapal-frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── contexts/        # Contextos de React (Auth)
│   │   ├── lib/             # Librerías y utilidades
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── App.tsx          # Componente principal
│   │   └── main.tsx         # Punto de entrada
│   ├── .env                 # Variables de entorno (crear)
│   └── package.json
│
└── sedapal-backend/
    ├── src/main/java/com/sedapal/
    │   ├── config/          # Configuraciones (CORS, Security)
    │   ├── controller/      # Controladores REST
    │   ├── model/           # Entidades JPA
    │   ├── repository/      # Repositorios
    │   ├── service/         # Lógica de negocio
    │   └── SedapalApplication.java
    └── pom.xml
```

## 🔐 Autenticación

El sistema utiliza Supabase Authentication:

1. Los usuarios deben ser creados en Supabase:
   - Ve a Authentication → Users en tu proyecto Supabase
   - Crea usuarios con email y contraseña

2. El login se hace desde la interfaz web en `/login`

3. La autenticación es manejada por:
   - Frontend: Context API + Supabase Client
   - Backend: JWT tokens (para futuras APIs protegidas)

## 🎯 Características Implementadas

### ✅ Frontend
- [x] Login con validación
- [x] Autenticación con Supabase
- [x] Protección de rutas
- [x] Dashboard básico
- [x] Diseño responsive con Tailwind
- [x] Paleta de colores SEDAPAL

### ✅ Backend
- [x] Estructura base Spring Boot
- [x] Configuración de Supabase/PostgreSQL
- [x] Entidades JPA
- [x] CORS configurado
- [x] Health check endpoint

## 📝 Próximos Pasos

1. **Crear las tablas en Supabase** para actividades y entregables
2. **Implementar CRUD** de actividades y entregables
3. **Agregar roles y permisos** 
4. **Dashboard con estadísticas** 
5. **Reportes y exportación** de datos

## 🔍 Verificar que Todo Funciona

### Frontend
```bash
cd sedapal-frontend
npm run dev
```
Abre http://localhost:5173 - deberías ver el login

### Backend
```bash
cd sedapal-backend
mvn spring-boot:run
```
Abre http://localhost:8080/api/health - deberías ver:
```json
{
  "status": "OK",
  "message": "SEDAPAL Backend is running"
}
```

## 📞 Soporte

Para cualquier problema, verifica:
1. Que las credenciales de Supabase estén correctas
2. Que los servicios estén corriendo
3. Que los puertos 5173 y 8080 estén disponibles

---

**Desarrollado para SEDAPAL** 💧
