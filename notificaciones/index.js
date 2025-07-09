const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

admin.initializeApp();

const GMAIL_EMAIL = 'soporte.nexify@gmail.com';
const GMAIL_PASSWORD = 'reeq bwts ioil vref';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_PASSWORD,
  },
});

exports.notificarContribucion = onDocumentCreated(
  "notificaciones/{userId}/mensajes/{mensajeId}",
  async (event) => {
    const snap = event.data;
    const userId = event.params.userId;
    const mensajeId = event.params.mensajeId;

    if (!snap) {
      console.warn("⚠️ Documento no encontrado.");
      return null;
    }

    const data = snap.data();

    let email = '';
    let nombre = 'usuario';

    try {
      const user = await admin.auth().getUser(userId);
      email = user.email;
      nombre = user.displayName || 'usuario';
    } catch (error) {
      console.error(`❌ Error al obtener datos del usuario ${userId}:`, error);
      return null; // Si el usuario no existe, no enviamos correo
    }

    const fecha = new Date(data.fecha._seconds * 1000).toLocaleString();

    let asunto = '';
    let html = '';

    if (data.titulo === 'Contribución enviada') {
      asunto = 'Contribución recibida';
      html = `
        <div style="font-family: Poppins, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0px 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #0BA37F;">¡Gracias por tu contribución!</h2>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Hemos recibido tu contribución y será procesada por nuestro equipo.</p>
            <p style="color: gray;"><small>Fecha: ${fecha}</small></p>
            <p>Gracias por ser parte de Imagro.</p>
          </div>
        </div>
      `;
    } else if (data.titulo === 'Contribución aceptada') {
      asunto = 'Tu contribución fue aceptada';
      html = `
        <div style="font-family: Poppins, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0px 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #0BA37F;">¡Contribución aprobada!</h2>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Nos complace informarte que tu contribución ha sido <strong>aceptada</strong> y se encuentra disponible en nuestro sistema.</p>
            <p style="color: gray;"><small>Fecha: ${fecha}</small></p>
            <p>Gracias por apoyar el desarrollo agrícola con tu aporte.</p>
          </div>
        </div>
      `;
    } else if (data.titulo === 'Contribución rechazada') {
      asunto = 'Tu contribución fue rechazada';
      html = `
        <div style="font-family: Poppins, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0px 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #D32F2F;">Contribución rechazada</h2>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Lamentablemente, tu contribución fue <strong>rechazada</strong> tras la revisión de nuestro equipo.</p>
            <p style="color: gray;"><small>Fecha: ${fecha}</small></p>
            <p>Te invitamos a revisar tus imágenes y volver a intentarlo. ¡Gracias por tu esfuerzo!</p>
          </div>
        </div>
      `;
    } else {
      console.warn("⚠️ Título no reconocido:", data.titulo);
      return null;
    }

    const mailOptions = {
      from: `"Imagro Soporte" <${GMAIL_EMAIL}>`,
      to: email,
      subject: asunto,
      html: html,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📤 Correo enviado a: ${email}`);
    } catch (error) {
      console.error('❌ Error al enviar el correo:', error);
    }

    return null;
  }
);
