import { Resend } from 'resend';

const { RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL, FRONTEND_URL } = process.env;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendWelcomeEmail({ email, name }) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !resend) {
    return { skipped: true, reason: 'missing_resend_config' };
  }

  const displayName = escapeHtml(name || email);
  const appUrl = APP_URL?.trim() || FRONTEND_URL?.trim();
  const appLink = appUrl
    ? `<p><a href="${escapeHtml(appUrl)}" style="color:#0F6E56;">Entrar a CataLog</a></p>`
    : '';

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: email,
    subject: 'Bienvenido a CataLog',
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f1f1a; line-height: 1.5;">
        <h1 style="color: #0F6E56;">Bienvenido a CataLog</h1>
        <p>Hola ${displayName},</p>
        <p>Tu cuenta se creó correctamente. Ya puedes empezar a crear tu catálogo y compartir tus productos.</p>
        ${appLink}
        <p>Gracias por usar CataLog.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'No se pudo enviar el email de bienvenida');
  }

  return { skipped: false, data };
}
