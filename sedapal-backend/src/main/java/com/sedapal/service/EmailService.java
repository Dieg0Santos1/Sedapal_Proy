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
                    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); 
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
                        
                        <div style="text-align: center;">
                            <a href="%s" class="btn">Iniciar Sesión</a>
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
                        <p>© %d SEDAPAL - Sistema de Gestión</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(nombreCompleto, email, contrasena, rolTexto, loginUrl, 
                         java.time.Year.now().getValue());
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
                    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); 
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
                        
                        <div style="text-align: center;">
                            <a href="%s" class="btn">Ir al Sistema</a>
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
                        <p>© %d SEDAPAL - Sistema de Gestión</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(nombreUsuario, nombreActividad, sistemaAbrev, equipoNombre, 
                         trimestre, fechaFormateada, loginUrl, java.time.Year.now().getValue());
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
                    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); 
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
                        
                        <div style="text-align: center;">
                            <a href="%s" class="btn">Iniciar Sesión</a>
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
                        <p>© %d SEDAPAL - Sistema de Gestión</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(nombreCompleto, email, contrasena, nombreActividad, sistemaAbrev, 
                         equipoNombre, trimestre, fechaFormateada, loginUrl, 
                         java.time.Year.now().getValue());
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
}
