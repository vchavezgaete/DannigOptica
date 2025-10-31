/**
 * Servicio de notificaciones multi-canal
 * 
 * Este módulo proporciona funcionalidades para enviar notificaciones a clientes
 * a través de diferentes canales de comunicación:
 * - Correo electrónico (implementado con nodemailer)
 * - SMS (preparado para integración con servicios como Twilio)
 * 
 * Incluye plantillas predefinidas para diferentes tipos de notificaciones:
 * - Recordatorios de citas
 * - Vencimiento de garantías
 * - Nuevos operativos oftalmológicos
 * - Confirmación de citas
 */

import nodemailer from "nodemailer";

// Interfaz para notificaciones por correo electrónico
interface NotificacionEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Interfaz para notificaciones por SMS
interface NotificacionSMS {
  to: string;
  message: string;
}

/**
 * Crea y configura el transporter de correo electrónico
 * Utiliza variables de entorno para la configuración SMTP
 * 
 * Variables de entorno requeridas:
 * - SMTP_HOST: Servidor SMTP (default: smtp.gmail.com)
 * - SMTP_PORT: Puerto SMTP (default: 587)
 * - SMTP_USER: Usuario de autenticación SMTP
 * - SMTP_PASSWORD: Contraseña de autenticación SMTP
 * - SMTP_FROM: Dirección de correo remitente (opcional)
 * 
 * Retorna: Transporter de nodemailer o null si no está configurado
 */
const createEmailTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@dannig.cl";

  if (!smtpUser || !smtpPass) {
    console.warn("SMTP no configurado. Las notificaciones por email no funcionarán.");
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true para puerto 465 (SSL), false para otros puertos
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

// Instancia única del transporter de email
const emailTransporter = createEmailTransporter();

/**
 * Envía una notificación por correo electrónico
 * 
 * @param notificacion - Objeto con los datos del email
 * @returns true si el email se envió correctamente, false en caso contrario
 */
export async function enviarEmail(notificacion: NotificacionEmail): Promise<boolean> {
  if (!emailTransporter) {
    console.error("No se puede enviar email: SMTP no configurado");
    return false;
  }

  try {
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@dannig.cl";
    
    await emailTransporter.sendMail({
      from: `Dannig Óptica <${smtpFrom}>`,
      to: notificacion.to,
      subject: notificacion.subject,
      html: notificacion.html,
      text: notificacion.text || notificacion.html.replace(/<[^>]*>/g, ""), // Extrae texto plano del HTML
    });

    console.log(`Email enviado a ${notificacion.to}`);
    return true;
  } catch (error: any) {
    console.error(`Error enviando email a ${notificacion.to}:`, error.message);
    return false;
  }
}

/**
 * Envía una notificación por SMS
 * 
 * NOTA: Esta función actualmente simula el envío de SMS.
 * Para implementación real, se requiere integrar un servicio SMS como:
 * - Twilio (https://www.twilio.com)
 * - AWS SNS (https://aws.amazon.com/sns/)
 * - Otra API de SMS
 * 
 * Variables de entorno requeridas para implementación:
 * - SMS_API_KEY: Clave API del proveedor SMS
 * - SMS_PROVIDER: Proveedor a utilizar (ej: "twilio")
 * - TWILIO_ACCOUNT_SID: Si se usa Twilio
 * - TWILIO_AUTH_TOKEN: Si se usa Twilio
 * - TWILIO_PHONE_NUMBER: Número de teléfono remitente (Twilio)
 * 
 * @param notificacion - Objeto con los datos del SMS
 * @returns true si el SMS se envió correctamente, false en caso contrario
 */
export async function enviarSMS(notificacion: NotificacionSMS): Promise<boolean> {
  const smsApiKey = process.env.SMS_API_KEY;
  const smsProvider = process.env.SMS_PROVIDER || "twilio";

  if (!smsApiKey) {
    console.warn("SMS no configurado. Las notificaciones por SMS no funcionarán.");
    return false;
  }

  // TODO: Implementar integración real con servicio SMS
  // Por ahora solo se registra en consola para desarrollo
  console.log(`[SMS SIMULADO] A ${notificacion.to}: ${notificacion.message}`);
  
  // Ejemplo de implementación con Twilio (comentado hasta tener credenciales):
  /*
  const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    await client.messages.create({
      body: notificacion.message,
      to: notificacion.to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    console.log(`SMS enviado a ${notificacion.to}`);
    return true;
  } catch (error) {
    console.error(`Error enviando SMS a ${notificacion.to}:`, error);
    return false;
  }
  */

  return true; // Retorna true en modo simulación
}

/**
 * Envía una notificación multi-canal
 * Permite enviar por email y/o SMS según los canales especificados
 * 
 * @param correo - Dirección de correo del destinatario (puede ser null)
 * @param telefono - Número de teléfono del destinatario (puede ser null)
 * @param asunto - Asunto del mensaje
 * @param mensaje - Contenido del mensaje (texto plano)
 * @param canales - Array con los canales a utilizar: ["Correo"] o ["SMS"] o ambos
 * @returns Objeto con el estado de envío por cada canal
 */
export async function enviarNotificacion(
  correo: string | null,
  telefono: string | null,
  asunto: string,
  mensaje: string,
  canales: Array<"Correo" | "SMS"> = ["Correo"]
): Promise<{ emailEnviado: boolean; smsEnviado: boolean }> {
  const resultado = {
    emailEnviado: false,
    smsEnviado: false,
  };

  // Genera HTML formateado del mensaje para emails
  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 2rem; text-align: center;">
        <h1 style="color: white; margin: 0;">Dannig Óptica</h1>
      </div>
      <div style="padding: 2rem; background: #f9fafb;">
        <h2 style="color: #065f46; margin-top: 0;">${asunto}</h2>
        <p style="color: #374151; line-height: 1.6; font-size: 1rem;">
          ${mensaje.replace(/\n/g, "<br>")}
        </p>
      </div>
      <div style="padding: 1rem; background: #e5e7eb; text-align: center; font-size: 0.875rem; color: #6b7280;">
        <p style="margin: 0;">Av. Pajaritos #3195, piso 13 oficina 1318, Maipú</p>
        <p style="margin: 0.5rem 0 0;">© 2025 Dannig Óptica</p>
      </div>
    </div>
  `;

  // Enviar por email si el canal está habilitado y el cliente tiene correo
  if (canales.includes("Correo") && correo) {
    resultado.emailEnviado = await enviarEmail({
      to: correo,
      subject: asunto,
      html: htmlMessage,
      text: mensaje,
    });
  }

  // Enviar por SMS si el canal está habilitado y el cliente tiene teléfono
  if (canales.includes("SMS") && telefono) {
    resultado.smsEnviado = await enviarSMS({
      to: telefono,
      message: `${asunto}: ${mensaje}`,
    });
  }

  return resultado;
}

/**
 * Plantillas de mensajes predefinidos para diferentes tipos de notificaciones
 * 
 * Cada plantilla recibe parámetros específicos y retorna un objeto con:
 * - asunto: Asunto del mensaje
 * - mensaje: Contenido del mensaje en texto plano
 */
export const plantillas = {
  /**
   * Plantilla para recordatorio de cita
   * Se envía 24 horas antes de la cita programada
   */
  recordatorioCita: (nombreCliente: string, fechaHora: string, lugar?: string) => ({
    asunto: "Recordatorio de Cita - Dannig Óptica",
    mensaje: `Hola ${nombreCliente},\n\nTe recordamos que tienes una cita agendada para:\nFecha y Hora: ${fechaHora}${lugar ? `\nLugar: ${lugar}` : ""}\n\nPor favor confirma tu asistencia o contáctanos si necesitas reprogramar.\n\nSaludos,\nEquipo Dannig Óptica`,
  }),

  /**
   * Plantilla para vencimiento de garantía
   * Se envía 7 días antes del vencimiento de la garantía
   */
  vencimientoGarantia: (nombreCliente: string, producto: string, fechaVencimiento: string) => ({
    asunto: "Vencimiento de Garantía - Dannig Óptica",
    mensaje: `Hola ${nombreCliente},\n\nTu garantía para el producto "${producto}" vencerá el ${fechaVencimiento}.\n\nSi necesitas hacer uso de tu garantía o tienes alguna consulta, contáctanos antes de la fecha de vencimiento.\n\nSaludos,\nEquipo Dannig Óptica`,
  }),

  /**
   * Plantilla para nuevo operativo oftalmológico
   * Se envía cuando se crea un nuevo operativo
   */
  nuevoOperativo: (nombreCliente: string, nombreOperativo: string, fecha: string, lugar: string) => ({
    asunto: "Nuevo Operativo Oftalmológico - Dannig Óptica",
    mensaje: `Hola ${nombreCliente},\n\nTenemos un nuevo operativo oftalmológico disponible:\n\n${nombreOperativo}\nFecha: ${fecha}\nLugar: ${lugar}\n\nSi estás interesado, contáctanos para agendar tu cita.\n\nSaludos,\nEquipo Dannig Óptica`,
  }),

  /**
   * Plantilla para confirmación de cita
   * Se envía cuando se confirma una cita
   */
  confirmacionCita: (nombreCliente: string, fechaHora: string, lugar?: string) => ({
    asunto: "Confirmación de Cita - Dannig Óptica",
    mensaje: `Hola ${nombreCliente},\n\nTu cita ha sido confirmada:\nFecha y Hora: ${fechaHora}${lugar ? `\nLugar: ${lugar}` : ""}\n\nTe esperamos.\n\nSaludos,\nEquipo Dannig Óptica`,
  }),
};
