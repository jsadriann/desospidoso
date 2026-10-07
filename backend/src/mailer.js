import { config } from './config.js';

let transporter = null;

async function getTransporter() {
  if (!config.smtp.host) return null;
  if (!transporter) {
    const nodemailer = (await import('nodemailer')).default;
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

/** Envia o código de redefinição. Sem SMTP configurado, mostra no terminal (modo desenvolvimento). */
export async function sendResetCode(email, name, code) {
  const t = await getTransporter();
  if (!t) {
    console.log(`\n[DesospIdoso] Código de redefinição para ${email}: ${code}\n`);
    return;
  }
  await t.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'DesospIdoso - Código para redefinição de senha',
    text: `Olá, ${name}!\n\nSeu código para redefinir a senha é: ${code}\n\nEle expira em ${config.resetCodeMinutes} minutos. Se você não pediu a redefinição, ignore este e-mail.`,
  });
}
