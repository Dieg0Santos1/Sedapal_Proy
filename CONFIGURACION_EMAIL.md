# Configuración de Emails en SEDAPAL

## 📧 Sistema de Notificaciones Implementado

Se ha implementado un sistema completo de notificaciones por email para:
1. **Nuevos usuarios**: Envío automático de credenciales
2. **Actividades asignadas**: Notificación con detalles de la actividad

---

## ✅ Funcionalidades Implementadas

### 1. **Email de Credenciales (Nuevo Usuario)**
Cuando se crea un usuario nuevo, automáticamente recibe un email con:
- Email de acceso
- Contraseña generada
- Rol asignado
- Botón para iniciar sesión
- Instrucciones de seguridad

**Template**: Diseño profesional con colores de SEDAPAL (azul)

### 2. **Email de Actividad Asignada (Usuario Existente)**
Cuando se asigna una actividad a un usuario existente, recibe un email con:
- Nombre de la actividad
- Sistema
- Equipo responsable
- Trimestre
- Fecha máxima de entrega
- Botón para ir al sistema
- Instrucciones de qué hacer

**Template**: Diseño profesional con detalles de la actividad

---

## 🔧 Configuración del Backend (Spring Boot)

### Archivo: `application.properties`

Agrega estas configuraciones para Gmail (u otro proveedor):

```properties
# ===================================
# CONFIGURACIÓN DE EMAIL
# ===================================

# Email del remitente
spring.mail.username=tu-email@gmail.com
spring.mail.password=tu-app-password

# Configuración de Gmail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.protocol=smtp
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.ssl.trust=smtp.gmail.com

# URL del frontend (para los botones en los emails)
app.frontend.url=http://localhost:5173

# Configuración adicional (opcional)
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000
```

---

## 📝 Cómo Obtener App Password de Gmail

### Opción 1: Usar Gmail con App Password (Recomendado)

1. **Habilita 2FA en tu cuenta de Gmail**
   - Ve a: https://myaccount.google.com/security
   - En "Verificación en dos pasos", haz clic en "Empezar"
   - Sigue los pasos para configurarlo

2. **Genera una App Password**
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Windows Computer" (o cualquier dispositivo)
   - Copia la contraseña de 16 caracteres generada
   - Úsala en `spring.mail.password`

3. **Configura en application.properties**:
```properties
spring.mail.username=tu-email@gmail.com
spring.mail.password=abcd efgh ijkl mnop  # App Password de 16 dígitos
```

### Opción 2: Usar Otro Proveedor de Email

#### **SendGrid** (Recomendado para producción)
```properties
spring.mail.host=smtp.sendgrid.net
spring.mail.port=587
spring.mail.username=apikey
spring.mail.password=tu-api-key-de-sendgrid
```

#### **Mailgun**
```properties
spring.mail.host=smtp.mailgun.org
spring.mail.port=587
spring.mail.username=tu-usuario@mailgun
spring.mail.password=tu-password-mailgun
```

#### **Office 365**
```properties
spring.mail.host=smtp.office365.com
spring.mail.port=587
spring.mail.username=tu-email@empresa.com
spring.mail.password=tu-password
```

---

## 🧪 Pruebas

### 1. **Probar Envío de Credenciales**

Cuando crees un nuevo usuario desde "Asignar Usuario" → "Crear Nuevo Usuario":
- Se envía automáticamente el email con las credenciales
- Revisa la bandeja de entrada del email proporcionado
- Verifica que llegue el email con el formato correcto

### 2. **Probar Notificación de Actividad**

Cuando asignes una actividad a un usuario existente:
- Selecciona "Asignar Usuario" → "Seleccionar Existente"
- Elige un usuario y confirma
- El usuario recibirá un email con los detalles de la actividad

### 3. **Revisar Logs**

En la consola del backend Spring Boot verás:
```
✅ Email de credenciales enviado a: usuario@ejemplo.com
✅ Email de actividad enviado a: usuario@ejemplo.com
```

O en caso de error:
```
❌ Error al enviar email a usuario@ejemplo.com: [mensaje de error]
```

---

## 🎨 Personalización de Templates

Los templates de email se encuentran en:
```
sedapal-backend/src/main/java/com/sedapal/service/EmailService.java
```

### **Cambiar Colores**

En el método `construirMensajeHtml` y `construirMensajeActividadHtml`:
```java
.header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); }
```

Cambia `#0284c7` y `#0369a1` por los colores que desees.

### **Cambiar Logo**

Actualmente usa emojis (🔐, 📝). Puedes agregar un logo:
```html
<img src="https://tu-sitio.com/logo.png" alt="Logo SEDAPAL" style="height: 50px;">
```

### **Cambiar Textos**

Modifica los textos directamente en los métodos de `EmailService.java`.

---

## 🚨 Troubleshooting

### **Error: "Authentication failed"**
✅ **Solución**: Verifica que usas la App Password (no tu contraseña normal de Gmail)

### **Error: "Could not connect to SMTP host"**
✅ **Solución**: 
- Verifica que el puerto sea 587 (no 465)
- Verifica que `starttls.enable=true`

### **Los emails llegan a SPAM**
✅ **Solución**:
- Usa un servicio profesional (SendGrid, Mailgun)
- Configura SPF, DKIM y DMARC en tu dominio
- Agrega un logo y footer profesional

### **No llegan los emails**
✅ **Solución**:
- Revisa los logs del backend
- Verifica que el backend esté corriendo
- Prueba enviar un email de prueba manualmente

---

## 📊 Endpoint de API

### **POST** `/api/notificaciones/actividad-asignada`

**Request Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "nombreUsuario": "Juan Pérez",
  "nombreActividad": "Auditoría de Sistema",
  "sistemaAbrev": "SAP",
  "equipoNombre": "Equipo TI",
  "trimestre": 2,
  "fechaMaxima": "2025-06-30"
}
```

**Response**: 
```
200 OK - "Notificación enviada exitosamente"
```

---

## 📝 Variables de Entorno (Producción)

Para producción, usa variables de entorno en lugar de application.properties:

```bash
export SPRING_MAIL_USERNAME=tu-email@gmail.com
export SPRING_MAIL_PASSWORD=tu-app-password
export APP_FRONTEND_URL=https://sedapal.tudominio.com
```

O en Docker/Kubernetes:
```yaml
env:
  - name: SPRING_MAIL_USERNAME
    value: tu-email@gmail.com
  - name: SPRING_MAIL_PASSWORD
    valueFrom:
      secretKeyRef:
        name: email-secret
        key: password
```

---

## ✅ Checklist de Configuración

- [ ] Configurar `application.properties` con credenciales de email
- [ ] Obtener App Password de Gmail (o API key de otro proveedor)
- [ ] Configurar URL del frontend en `app.frontend.url`
- [ ] Reiniciar el backend de Spring Boot
- [ ] Probar creando un nuevo usuario
- [ ] Probar asignando actividad a usuario existente
- [ ] Verificar que los emails lleguen correctamente
- [ ] Revisar que no lleguen a SPAM
- [ ] Personalizar templates si es necesario

---

## 🎉 ¡Listo!

El sistema de emails está completamente funcional. Los usuarios recibirán automáticamente:
- ✅ Credenciales al ser creados
- ✅ Notificación cuando se les asigne una actividad

Todos los emails tienen un diseño profesional y responsive que se ve bien en desktop y móvil.
