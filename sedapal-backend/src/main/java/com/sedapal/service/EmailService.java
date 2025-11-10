package com.sedapal.service;

import com.sedapal.model.Usuario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@sedapal.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Enviar credenciales de acceso por email
     */
    public void enviarCredenciales(String email, String nombre, String apellido, 
                                   String contrasena, Usuario.Rol rol) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject(obtenerAsunto(rol));
            helper.setText(construirMensajeHtml(nombre, apellido, email, contrasena, rol), true);

            mailSender.send(message);
            log.info("✅ Email enviado exitosamente a: {}", email);
        } catch (MessagingException e) {
            log.error("❌ Error al enviar email a {}: {}", email, e.getMessage());
            throw new RuntimeException("Error al enviar email: " + e.getMessage());
        }
    }

    /**
     * Obtener asunto según el rol
     */
    private String obtenerAsunto(Usuario.Rol rol) {
        return switch (rol) {
            case admin -> "🔐 Acceso como Administrador - Sistema SEDAPAL";
            case usuario -> "🔐 Acceso como Usuario - Sistema SEDAPAL";
            default -> "🔐 Acceso al Sistema SEDAPAL";
        };
    }

    /**
     * Construir mensaje HTML del email
     */
    private String construirMensajeHtml(String nombre, String apellido, String email, 
                                       String contrasena, Usuario.Rol rol) {
        String nombreCompleto = nombre + " " + apellido;
        String rolTexto = obtenerTextoRol(rol);
        String loginUrl = frontendUrl + "/login";

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #0284c7 0%%, #0369a1 100%%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                    .credentials-box { background: #f3f4f6; padding: 20px; border-radius: 8px; 
                                      margin: 20px 0; border-left: 4px solid #0284c7; }
                    .credentials-box p { margin: 10px 0; }
                    .credentials-box strong { color: #0284c7; }
                    .btn { display: inline-block; background: #0284c7; color: white; 
                          padding: 12px 30px; text-decoration: none; border-radius: 6px; 
                          margin: 20px 0; font-weight: bold; }
                    .btn:hover { background: #0369a1; }
                    .warning { background: #fef2f2; border-left: 4px solid #dc2626; 
                              padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .warning p { color: #991b1b; margin: 5px 0; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; 
                             color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Credenciales de Acceso</h1>
                        <p>Sistema de Gestión SEDAPAL</p>
                    </div>
                    
                    <div class="content">
                        <p>Hola <strong>%s</strong>,</p>
                        
                        <p>Se te ha asignado acceso al Sistema de Gestión SEDAPAL con las siguientes credenciales:</p>
                        
                        <div class="credentials-box">
                            <p><strong>📧 Email:</strong> %s</p>
                            <p><strong>🔑 Contraseña:</strong> %s</p>
                            <p><strong>👤 Rol:</strong> %s</p>
                        </div>
                        
                        <div class="warning">
                            <p><strong>⚠️ IMPORTANTE:</strong></p>
                            <p>• Esta contraseña es temporal y debe ser guardada en un lugar seguro</p>
                            <p>• No compartas tus credenciales con nadie</p>
                            <p>• Se recomienda cambiar la contraseña al primer inicio de sesión</p>
                        </div>
                        
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            Si no solicitaste este acceso, contacta inmediatamente al administrador del sistema.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>Este es un correo automático, por favor no responder.</p>
                        <p>© %d SEDAPAL - Sistema de Gestión Institucional</p>
                        %s
                    </div>
                </div>
            </body>
            </html>
            """.formatted(nombreCompleto, email, contrasena, rolTexto, 
                         java.time.Year.now().getValue(), construirFooterLogo());
    }

    /**
     * Obtener texto descriptivo del rol
     */
    private String obtenerTextoRol(Usuario.Rol rol) {
        return switch (rol) {
            case superadmin -> "Super Administrador";
            case admin -> "Administrador";
            case usuario -> "Usuario";
        };
    }

    /**
     * Enviar notificación de nueva actividad asignada
     */
    public void enviarNotificacionActividad(String email, String nombreUsuario, 
                                           String nombreActividad, String sistemaAbrev,
                                           String equipoNombre, int trimestre, 
                                           String fechaMaxima) {
        try {
            log.debug("📋 Parámetros recibidos: email={}, nombreUsuario={}, nombreActividad={}, sistemaAbrev={}, equipoNombre={}, trimestre={}, fechaMaxima={}",
                     email, nombreUsuario, nombreActividad, sistemaAbrev, equipoNombre, trimestre, fechaMaxima);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("📝 Nueva Actividad Asignada - Sistema SEDAPAL");
            helper.setText(construirMensajeActividadHtml(nombreUsuario, nombreActividad, 
                          sistemaAbrev, equipoNombre, trimestre, fechaMaxima), true);

            mailSender.send(message);
            log.info("✅ Email de actividad enviado a: {}", email);
        } catch (MessagingException e) {
            log.error("❌ Error al enviar email de actividad a {}: {}", email, e.getMessage());
            throw new RuntimeException("Error al enviar email: " + e.getMessage());
        }
    }

    /**
     * Construir mensaje HTML para notificación de actividad
     */
    private String construirMensajeActividadHtml(String nombreUsuario, String nombreActividad,
                                                String sistemaAbrev, String equipoNombre,
                                                int trimestre, String fechaMaxima) {
        String loginUrl = frontendUrl + "/login";
        String fechaFormateada = fechaMaxima != null ? fechaMaxima : "No especificada";

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #0284c7 0%%, #0369a1 100%%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                    .activity-box { background: #f0f9ff; padding: 20px; border-radius: 8px; 
                                   margin: 20px 0; border-left: 4px solid #0284c7; }
                    .activity-box p { margin: 10px 0; }
                    .activity-box strong { color: #0369a1; }
                    .activity-name { font-size: 18px; color: #0369a1; font-weight: bold; 
                                    margin-bottom: 15px; }
                    .btn { display: inline-block; background: #0284c7; color: white; 
                          padding: 12px 30px; text-decoration: none; border-radius: 6px; 
                          margin: 20px 0; font-weight: bold; }
                    .btn:hover { background: #0369a1; }
                    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; 
                               padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .info-box p { color: #92400e; margin: 5px 0; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; 
                             color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
                    .detail-row { display: flex; justify-content: space-between; 
                                 padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail-label { color: #6b7280; }
                    .detail-value { font-weight: bold; color: #111827; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📝 Nueva Actividad Asignada</h1>
                        <p>Sistema de Gestión SEDAPAL</p>
                    </div>
                    
                    <div class="content">
                        <p>Hola <strong>%s</strong>,</p>
                        
                        <p>Se te ha asignado una nueva actividad en el Sistema de Gestión SEDAPAL:</p>
                        
                        <div class="activity-box">
                            <div class="activity-name">📌 %s</div>
                            
                            <div class="detail-row">
                                <span class="detail-label">📊 Sistema:</span>
                                <span class="detail-value">%s</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">👥 Equipo Responsable:</span>
                                <span class="detail-value">%s</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">📅 Trimestre:</span>
                                <span class="detail-value">Trimestre %d</span>
                            </div>
                            
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">⏰ Fecha Máxima:</span>
                                <span class="detail-value">%s</span>
                            </div>
                        </div>
                        
                        <div class="info-box">
                            <p><strong>💡 Qué hacer ahora:</strong></p>
                            <p>• Inicia sesión en el sistema</p>
                            <p>• Revisa los detalles de la actividad</p>
                            <p>• Sube los entregables antes de la fecha máxima</p>
                        </div>
                        
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            Si tienes alguna duda sobre esta actividad, contacta a tu administrador.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>Este es un correo automático, por favor no responder.</p>
                        <p>© %d SEDAPAL - Sistema de Gestión Institucional</p>
                        %s
                    </div>
                </div>
            </body>
            </html>
            """.formatted(nombreUsuario, nombreActividad, sistemaAbrev, equipoNombre, 
                         trimestre, fechaFormateada, java.time.Year.now().getValue(), construirFooterLogo());
    }

    /**
     * Enviar credenciales con actividad asignada (usuario nuevo + actividad)
     */
    public void enviarCredencialesConActividad(String email, String nombre, String apellido, 
                                               String contrasena, String nombreActividad, 
                                               String sistemaAbrev, String equipoNombre, 
                                               int trimestre, String fechaMaxima) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("🔐 Credenciales de Acceso y Nueva Actividad - Sistema SEDAPAL");
            helper.setText(construirMensajeCredencialesConActividadHtml(nombre, apellido, email, 
                          contrasena, nombreActividad, sistemaAbrev, equipoNombre, trimestre, 
                          fechaMaxima), true);

            mailSender.send(message);
            log.info("✅ Email de credenciales + actividad enviado a: {}", email);
        } catch (MessagingException e) {
            log.error("❌ Error al enviar email a {}: {}", email, e.getMessage());
            throw new RuntimeException("Error al enviar email: " + e.getMessage());
        }
    }

    /**
     * Construir mensaje HTML para credenciales + actividad
     */
    private String construirMensajeCredencialesConActividadHtml(String nombre, String apellido, 
                                                                String email, String contrasena,
                                                                String nombreActividad, 
                                                                String sistemaAbrev, 
                                                                String equipoNombre, int trimestre, 
                                                                String fechaMaxima) {
        String nombreCompleto = nombre + " " + apellido;
        String loginUrl = frontendUrl + "/login";
        String fechaFormateada = fechaMaxima != null ? fechaMaxima : "No especificada";

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #0284c7 0%%, #0369a1 100%%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                    .credentials-box { background: #f3f4f6; padding: 20px; border-radius: 8px; 
                                      margin: 20px 0; border-left: 4px solid #0284c7; }
                    .credentials-box p { margin: 10px 0; }
                    .credentials-box strong { color: #0284c7; }
                    .activity-box { background: #f0f9ff; padding: 20px; border-radius: 8px; 
                                   margin: 20px 0; border-left: 4px solid #10b981; }
                    .activity-box p { margin: 10px 0; }
                    .activity-box strong { color: #059669; }
                    .activity-name { font-size: 18px; color: #0369a1; font-weight: bold; 
                                    margin-bottom: 15px; }
                    .btn { display: inline-block; background: #0284c7; color: white; 
                          padding: 12px 30px; text-decoration: none; border-radius: 6px; 
                          margin: 20px 0; font-weight: bold; }
                    .btn:hover { background: #0369a1; }
                    .warning { background: #fef2f2; border-left: 4px solid #dc2626; 
                              padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .warning p { color: #991b1b; margin: 5px 0; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; 
                             color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
                    .detail-row { display: flex; justify-content: space-between; 
                                 padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail-label { color: #6b7280; }
                    .detail-value { font-weight: bold; color: #111827; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Bienvenido al Sistema SEDAPAL</h1>
                        <p>Credenciales de Acceso + Actividad Asignada</p>
                    </div>
                    
                    <div class="content">
                        <p>Hola <strong>%s</strong>,</p>
                        
                        <p>Se te ha creado una cuenta en el Sistema de Gestión SEDAPAL y se te ha asignado una nueva actividad.</p>
                        
                        <div class="credentials-box">
                            <p><strong>🔐 TUS CREDENCIALES DE ACCESO:</strong></p>
                            <p><strong>📧 Email:</strong> %s</p>
                            <p><strong>🔑 Contraseña:</strong> %s</p>
                            <p><strong>👤 Rol:</strong> Usuario</p>
                        </div>
                        
                        <div class="activity-box">
                            <p><strong>📝 ACTIVIDAD ASIGNADA:</strong></p>
                            <div class="activity-name">📌 %s</div>
                            
                            <div class="detail-row">
                                <span class="detail-label">📊 Sistema:</span>
                                <span class="detail-value">%s</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">👥 Equipo Responsable:</span>
                                <span class="detail-value">%s</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">📅 Trimestre:</span>
                                <span class="detail-value">Trimestre %d</span>
                            </div>
                            
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">⏰ Fecha Máxima:</span>
                                <span class="detail-value">%s</span>
                            </div>
                        </div>
                        
                        <div class="warning">
                            <p><strong>⚠️ IMPORTANTE:</strong></p>
                            <p>• Guarda tus credenciales en un lugar seguro</p>
                            <p>• No compartas tu contraseña con nadie</p>
                            <p>• Se recomienda cambiar la contraseña al primer inicio de sesión</p>
                            <p>• Recuerda subir los entregables antes de la fecha máxima</p>
                        </div>
                        
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            Si no solicitaste este acceso, contacta inmediatamente al administrador del sistema.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>Este es un correo automático, por favor no responder.</p>
                        <p>© %d SEDAPAL - Sistema de Gestión Institucional</p>
                        %s
                    </div>
                </div>
            </body>
            </html>
            """.formatted(nombreCompleto, email, contrasena, nombreActividad, sistemaAbrev, 
                         equipoNombre, trimestre, fechaFormateada, 
                         java.time.Year.now().getValue(), construirFooterLogo());
    }

    /**
     * Enviar email simple (para testing)
     */
    public void enviarEmailSimple(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            log.info("✅ Email simple enviado a: {}", to);
        } catch (Exception e) {
            log.error("❌ Error al enviar email simple: {}", e.getMessage());
            throw new RuntimeException("Error al enviar email: " + e.getMessage());
        }
    }

    // ================= Nuevos correos de notificación =================
    public void enviarNotificacionUsuarioCumplio(String adminEmail, String usuarioNombre, String usuarioEmail,
                                                String nombreActividad, String entregableNombre, String sistemaAbrev,
                                                String equipoNombre, String fechaMaxima) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(adminEmail);
            helper.setSubject("🕓 Revisión requerida: " + nombreActividad);
            String html = construirHtmlNotificacionUsuarioCumplio(usuarioNombre, usuarioEmail, nombreActividad,
                    entregableNombre, sistemaAbrev, equipoNombre, fechaMaxima);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Notificación enviada al admin {} por cumplimiento de {}", adminEmail, usuarioEmail);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar notificación: " + e.getMessage());
        }
    }

    public void enviarNotificacionConforme(java.util.List<String> usuariosDestino,
                                           java.util.List<String> superadminsDestino,
                                           String nombreActividad, String entregableNombre,
                                           String sistemaAbrev, String equipoNombre, String fechaMaxima) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            java.util.List<String> destinatarios = new java.util.ArrayList<>();
            if (usuariosDestino != null) destinatarios.addAll(usuariosDestino);
            if (superadminsDestino != null) destinatarios.addAll(superadminsDestino);
            helper.setTo(destinatarios.toArray(String[]::new));
            helper.setSubject("✅ Actividad validada: " + nombreActividad);
            String html = construirHtmlNotificacionConforme(nombreActividad, entregableNombre, sistemaAbrev, equipoNombre, fechaMaxima);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Notificación de conforme enviada a {} destinatarios", destinatarios.size());
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar notificación: " + e.getMessage());
        }
    }

    // ================= Usuario creado con equipo/gerencia =================
    public void enviarUsuarioCreado(String email, String nombreUsuario, String contrasena,
                                    String gerenciaNombre, String equipoNombre) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("👤 Usuario creado - Accesos y pertenencia");
            String html = construirHtmlUsuarioCreado(nombreUsuario, email, contrasena, gerenciaNombre, equipoNombre);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Notificación de usuario creado enviada a {}", email);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar notificación: " + e.getMessage());
        }
    }

    private String construirFooterLogo() {
        // Logo oficial SEDAPAL (PNG)
        // Usar URL pública proporcionada por el cliente
        String logoUrl = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.fonafe.gob.pe%2Fempresasdelacorporacion%2Fsedapalsa&psig=AOvVaw09E8twOe-55TXxJ0Fwbx67&ust=1762608395663000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCICp1Y2S4JADFQAAAAAdAAAAABAE";
        return """
            <div style=\"text-align:center;margin-top:24px;\"> 
              <img src=\"%s\" alt=\"SEDAPAL\" style=\"height:50px;opacity:0.95;display:inline-block\"/>
            </div>
        """.formatted(logoUrl);
    }

    private String construirHtmlUsuarioCreado(String nombreUsuario, String email, String contrasena,
                                              String gerenciaNombre, String equipoNombre) {
        return """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset=\"UTF-8\" />
          <style>
            body { font-family: Arial, sans-serif; color:#111827; }
            .header { background: linear-gradient(135deg, #0284c7 0%%, #0369a1 100%%); color:#fff; padding:24px; border-radius:10px 10px 0 0; text-align:center }
            .content { background:#fff; border:1px solid #e5e7eb; border-top:none; padding:24px; border-radius:0 0 10px 10px }
            .credentials { background:#f3f4f6; border-left:4px solid #0284c7; padding:16px; border-radius:8px; margin:16px 0 }
            .assignment { background:#ecfeff; border-left:4px solid #06b6d4; padding:16px; border-radius:8px; margin:16px 0 }
            .row { display:flex; justify-content:space-between; border-bottom:1px solid #e5e7eb; padding:8px 0 }
            .row:last-child { border-bottom:none }
            .label { color:#6b7280 }
            .value { font-weight:600; color:#111827 }
            .footer { text-align:center; color:#6b7280; font-size:12px; margin-top:16px }
          </style>
        </head>
        <body>
          <div class=\"header\">
            <h2 style=\"margin:0\">👤 Usuario creado</h2>
            <div style=\"opacity:.9;font-size:12px\">Sistema de Gestión SEDAPAL</div>
          </div>
          <div class=\"content\">
            <p>Hola <strong>%s</strong>,</p>
            <p>Tu cuenta ha sido creada. Estos son tus accesos y tu pertenencia organizacional:</p>
            <div class=\"credentials\">
              <div class=\"row\"><span class=\"label\">📧 Email</span><span class=\"value\">%s</span></div>
              <div class=\"row\"><span class=\"label\">🔑 Contraseña</span><span class=\"value\">%s</span></div>
              <div class=\"row\"><span class=\"label\">👤 Rol</span><span class=\"value\">Usuario</span></div>
            </div>
            <div class=\"assignment\">
              <div class=\"row\"><span class=\"label\">🏢 Gerencia</span><span class=\"value\">%s</span></div>
              <div class=\"row\"><span class=\"label\">👥 Equipo</span><span class=\"value\">%s</span></div>
            </div>
            <div class=\"footer\">%s</div>
          </div>
        </body>
        </html>
        """.formatted(nombreUsuario, email, contrasena, gerenciaNombre, equipoNombre, construirFooterLogo());
    }

    public void enviarAsignacionSistema(String email, String nombreAdmin, String sistemaAbrev, String sistemaNombre) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("🛠️ Sistema asignado: " + (sistemaAbrev != null ? sistemaAbrev : ""));
            String html = construirHtmlAsignacionSistema(nombreAdmin, sistemaAbrev, sistemaNombre);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Notificación de asignación de sistema enviada a {}", email);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar notificación: " + e.getMessage());
        }
    }

    private String construirHtmlAsignacionSistema(String nombreAdmin, String sistemaAbrev, String sistemaNombre) {
        return """
        <div style=\"font-family:Arial,sans-serif;color:#111827\"> 
          <div style=\"background:linear-gradient(135deg,#0284c7 0%%,#0369a1 100%%);color:#fff;padding:24px;border-radius:10px 10px 0 0;text-align:center\">
            <h2 style=\"margin:0;font-size:22px\">🛠️ Asignación de Sistema</h2>
            <div style=\"opacity:.9;font-size:12px\">Sistema de Gestión SEDAPAL</div>
          </div>
          <div style=\"background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px\">
            <p>Hola <strong>%s</strong>,</p>
            <p>Se te ha asignado el siguiente sistema:</p>
            <div style=\"background:#ecfeff;border-left:4px solid #06b6d4;padding:16px;border-radius:8px;margin:16px 0\">
              <div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:8px 0\"><span style=\"color:#6b7280\">Sigla</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
              <div style=\"display:flex;justify-content:space-between;padding:8px 0\"><span style=\"color:#6b7280\">Nombre</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
            </div>
            %s
          </div>
        </div>
        """.formatted(nombreAdmin, sistemaAbrev != null ? sistemaAbrev : "N/A", sistemaNombre != null ? sistemaNombre : "Sistema", construirFooterLogo());
    }

    private String construirHtmlNotificacionUsuarioCumplio(String usuarioNombre, String usuarioEmail,
                                                           String nombreActividad, String entregableNombre,
                                                           String sistemaAbrev, String equipoNombre, String fechaMaxima) {
        String loginUrl = frontendUrl + "/login";
        String fecha = fechaMaxima != null ? fechaMaxima : "No especificada";
        return """
        <div style=\"font-family:Arial,sans-serif;color:#111827\"> 
<div style=\"background:linear-gradient(135deg,#0284c7 0%%,#0369a1 100%%);color:#fff;padding:24px;border-radius:10px 10px 0 0;text-align:center\">
            <h2 style=\"margin:0;font-size:22px\">🕓 Revisión requerida</h2>
            <div style=\"opacity:.9;font-size:12px\">Sistema de Gestión SEDAPAL</div>
          </div>
          <div style=\"background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px\">
            <p>El usuario <strong>%s</strong> (<a href=\"mailto:%s\">%s</a>) marcó su actividad como <strong>Cumplió</strong>.</p>
            <div style=\"background:#f0f9ff;border-left:4px solid #0284c7;padding:16px;border-radius:8px;margin:16px 0\">
              <div style=\"font-weight:600;color:#0369a1;font-size:16px;margin-bottom:8px\">📌 %s</div>
              <div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:8px 0\"><span style=\"color:#6b7280\">📑 Entregable:</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
              <div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:8px 0\"><span style=\"color:#6b7280\">📊 Sistema:</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
              <div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:8px 0\"><span style=\"color:#6b7280\">👥 Equipo:</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
              <div style=\"display:flex;justify-content:space-between;padding:8px 0\"><span style=\"color:#6b7280\">⏰ Fecha máxima:</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
            </div>
            <div style=\"background:#fff7ed;border-left:4px solid #f59e0b;padding:12px;border-radius:4px;color:#92400e;font-size:13px\">Revisa el entregable y si corresponde, marca <strong>Conforme</strong>.</div>
            %s
          </div>
        </div>
        """.formatted(usuarioNombre, usuarioEmail, usuarioEmail, nombreActividad,
                entregableNombre != null ? entregableNombre : "No especificado",
                sistemaAbrev != null ? sistemaAbrev : "N/A",
                equipoNombre != null ? equipoNombre : "N/A",
                fecha, construirFooterLogo());
    }

    private String construirHtmlNotificacionConforme(String nombreActividad, String entregableNombre,
                                                     String sistemaAbrev, String equipoNombre, String fechaMaxima) {
        String loginUrl = frontendUrl + "/login";
        String fecha = fechaMaxima != null ? fechaMaxima : "No especificada";
        return """
        <div style=\"font-family:Arial,sans-serif;color:#111827\"> 
<div style=\"background:linear-gradient(135deg,#10b981 0%%,#059669 100%%);color:#fff;padding:24px;border-radius:10px 10px 0 0;text-align:center\">
            <h2 style=\"margin:0;font-size:22px\">✅ Actividad validada</h2>
            <div style=\"opacity:.9;font-size:12px\">Sistema de Gestión SEDAPAL</div>
          </div>
          <div style=\"background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px\">
            <p>La actividad fue revisada y <strong>validada (Conforme)</strong>. El estado pasó a <strong>Completado</strong>.</p>
            <div style=\"background:#ecfdf5;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:16px 0\">
              <div style=\"font-weight:600;color:#047857;font-size:16px;margin-bottom:8px\">📌 %s</div>
              <div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:8px 0\"><span style=\"color:#6b7280\">📑 Entregable:</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
              <div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:8px 0\"><span style=\"color:#6b7280\">📊 Sistema:</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
              <div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:8px 0\"><span style=\"color:#6b7280\">👥 Equipo:</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
              <div style=\"display:flex;justify-content:space-between;padding:8px 0\"><span style=\"color:#6b7280\">⏰ Fecha máxima:</span><span style=\"font-weight:600;color:#111827\">%s</span></div>
            </div>
            %s
          </div>
        </div>
        """.formatted(nombreActividad,
                entregableNombre != null ? entregableNombre : "No especificado",
                sistemaAbrev != null ? sistemaAbrev : "N/A",
                equipoNombre != null ? equipoNombre : "N/A",
                fecha, construirFooterLogo());
    }
}
