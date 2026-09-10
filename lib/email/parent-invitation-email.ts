import "server-only";

export type ParentInvitationEmailInput = {
  parentName: string;
  kidName: string;
  roomLabel: string;
  code: string;
  activationUrl: string;
};

export type ParentInvitationEmail = {
  subject: string;
  html: string;
  text: string;
};

export const INVITATION_EXPIRY_NOTICE = "Vence en 7 días";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** OpenDayCare palette, inlined because email clients ignore stylesheets. */
const COLORS = {
  cream: "#F6ECDF",
  card: "#FFFDF9",
  border: "#ECE0D0",
  coral: "#F2937A",
  coralButton: "#EE8164",
  heading: "#3F362E",
  copy: "#4A4038",
  muted: "#94887B",
  codeBackground: "#FBF1D6",
  codeBorder: "#E6D08A",
  codeLabel: "#A88526",
} as const;

/** Escapes every dynamic value before it reaches the markup. */
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHtml(input: ParentInvitationEmailInput) {
  const parentName = escapeHtml(input.parentName);
  const kidName = escapeHtml(input.kidName);
  const roomLabel = escapeHtml(input.roomLabel);
  const code = escapeHtml(input.code);
  const activationUrl = escapeHtml(input.activationUrl);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invitación de OpenDayCare</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.cream};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.cream};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:20px;">
            <tr>
              <td align="center" style="background-color:${COLORS.coral};border-radius:20px 20px 0 0;padding:22px 28px;">
                <span style="font-family:${FONT_STACK};font-size:20px;font-weight:800;letter-spacing:0.4px;color:#FFFFFF;">OpenDayCare</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLORS.copy};">
                <p style="margin:0 0 14px;">Hola ${parentName},</p>
                <p style="margin:0 0 20px;">
                  Te invitaron a seguir a <strong style="color:${COLORS.heading};">${kidName}</strong>
                  de ${roomLabel} en OpenDayCare.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
                  <tr>
                    <td align="center" style="background-color:${COLORS.codeBackground};border:1.5px dashed ${COLORS.codeBorder};border-radius:16px;padding:18px;">
                      <p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:12px;font-weight:800;letter-spacing:0.7px;color:${COLORS.codeLabel};">CÓDIGO DE INVITACIÓN</p>
                      <p style="margin:0;font-family:${FONT_STACK};font-size:32px;font-weight:700;letter-spacing:6px;color:${COLORS.heading};">${code}</p>
                      <p style="margin:6px 0 0;font-family:${FONT_STACK};font-size:13px;color:${COLORS.codeLabel};">${INVITATION_EXPIRY_NOTICE}</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
                  <tr>
                    <td align="center" style="background-color:${COLORS.coralButton};border-radius:14px;">
                      <a href="${activationUrl}" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:15.5px;font-weight:800;color:#FFFFFF;text-decoration:none;">Activar mi cuenta</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 6px;font-size:13px;color:${COLORS.muted};">Si el botón no funciona, copiá y pegá este enlace:</p>
                <p style="margin:0 0 22px;font-size:13px;word-break:break-all;">
                  <a href="${activationUrl}" style="color:${COLORS.coralButton};">${activationUrl}</a>
                </p>

                <p style="margin:0;padding-top:18px;border-top:1px solid ${COLORS.border};font-size:13px;color:${COLORS.muted};">
                  Si no esperabas esta invitación, podés ignorar este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText(input: ParentInvitationEmailInput) {
  return [
    "OpenDayCare",
    "",
    `Hola ${input.parentName},`,
    "",
    `Te invitaron a seguir a ${input.kidName} de ${input.roomLabel} en OpenDayCare.`,
    "",
    `Código de invitación: ${input.code}`,
    INVITATION_EXPIRY_NOTICE,
    "",
    "Activá tu cuenta desde este enlace:",
    input.activationUrl,
    "",
    "Si no esperabas esta invitación, podés ignorar este correo.",
  ].join("\n");
}

export function renderParentInvitationEmail(
  input: ParentInvitationEmailInput,
): ParentInvitationEmail {
  return {
    subject: `Te invitaron a seguir a ${input.kidName} en OpenDayCare`,
    html: renderHtml(input),
    text: renderText(input),
  };
}
