const nodemailer = require('nodemailer');

// Sends from the store's Gmail account using an app password (GMAIL_USER / GMAIL_APP_PASSWORD).
// Without them (local development), the email is printed in the server console instead.
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '') },
    })
    : null;

async function sendPasswordResetEmail(to, name, link) {
    const text = `Hola ${name},\n\nRecibimos un pedido para cambiar la contraseña de tu cuenta en Beet Generation.\n` +
        `Para crear una nueva, abrí este enlace (vence en 30 minutos):\n\n${link}\n\n` +
        'Si no lo pediste, ignorá este correo: tu contraseña no cambia.';
    if (!transporter) {
        console.log(`[correo no enviado: faltan GMAIL_USER y GMAIL_APP_PASSWORD]\nPara: ${to}\n${text}`);
        return;
    }
    await transporter.sendMail({
        from: `"Beet Generation" <${process.env.GMAIL_USER}>`,
        to,
        subject: 'Recuperá tu contraseña de Beet Generation',
        text,
    });
}

module.exports = { sendPasswordResetEmail };
