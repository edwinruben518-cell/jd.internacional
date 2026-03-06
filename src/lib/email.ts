import nodemailer from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function emailWrapper(content: string, accentColor = '#00F5FF'): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JD INTERNACIONAL</title>
</head>
<body style="margin:0;padding:0;background-color:#07080F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#07080F;padding:48px 16px;">
  <tr>
    <td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#00F5FF 0%,#9B00FF 100%);border-radius:10px;padding:8px 13px;">
                  <span style="color:#000;font-size:15px;font-weight:900;letter-spacing:2px;">JD</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="color:rgba(255,255,255,0.85);font-size:13px;font-weight:700;letter-spacing:3.5px;">INTERNACIONAL</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#0D0F1E;border:1px solid rgba(255,255,255,0.07);border-radius:18px;overflow:hidden;">

            <!-- top line -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="height:1px;background:linear-gradient(90deg,transparent 0%,${accentColor} 50%,transparent 100%);"></td>
              </tr>
            </table>

            <!-- content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px 32px;">
                  ${content}
                </td>
              </tr>
            </table>

            <!-- bottom line -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="height:1px;background:rgba(255,255,255,0.04);"></td>
              </tr>
            </table>

            <!-- card footer -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:14px 32px;">
                  <p style="color:rgba(255,255,255,0.18);font-size:11px;margin:0;letter-spacing:0.5px;">jdinternacional.com &nbsp;·&nbsp; soporte@jdinternacional.com</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="color:rgba(255,255,255,0.15);font-size:11px;margin:0;letter-spacing:0.5px;">
              © 2026 JD INTERNACIONAL. Todos los derechos reservados.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
  `.trim()
}

export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  referralCode: string
): Promise<boolean> {
  const inviteLink = `${APP_URL}/register?ref=${referralCode}`

  const content = `
    <!-- label -->
    <p style="color:#00F5FF;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">Cuenta creada exitosamente</p>

    <!-- heading -->
    <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 10px;letter-spacing:-0.3px;line-height:1.3;">
      Bienvenido, ${fullName}
    </h1>
    <p style="color:rgba(255,255,255,0.45);font-size:13px;margin:0 0 32px;line-height:1.8;">
      Ya formas parte de la red <span style="color:rgba(255,255,255,0.7);font-weight:600;">JD INTERNACIONAL</span>.
      Comparte tu código y empieza a construir tu negocio digital hoy mismo.
    </p>

    <!-- divider -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="height:1px;background:rgba(255,255,255,0.06);"></td></tr>
    </table>

    <!-- referral code -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:rgba(0,245,255,0.04);border:1px solid rgba(0,245,255,0.12);border-radius:12px;padding:20px 22px;">
          <p style="color:rgba(255,255,255,0.3);font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Código de referido</p>
          <p style="color:#00F5FF;font-size:26px;font-weight:900;letter-spacing:10px;margin:0;font-family:'Courier New',Courier,monospace;">${referralCode}</p>
        </td>
      </tr>
    </table>

    <!-- invite link -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 18px;">
          <p style="color:rgba(255,255,255,0.25);font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 5px;">Enlace de invitación</p>
          <p style="color:rgba(0,255,136,0.7);font-size:11px;margin:0;word-break:break-all;font-family:'Courier New',Courier,monospace;">${inviteLink}</p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-radius:10px;background:linear-gradient(135deg,#00F5FF 0%,#00FF88 100%);">
          <a href="${APP_URL}/dashboard"
             style="display:inline-block;color:#000000;text-decoration:none;font-weight:700;font-size:13px;padding:12px 30px;border-radius:10px;letter-spacing:0.5px;">
            Ir a mi panel &rarr;
          </a>
        </td>
      </tr>
    </table>
  `

  try {
    await transporter.sendMail({
      from: `"JD INTERNACIONAL" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Bienvenido a JD INTERNACIONAL, ${fullName}`,
      html: emailWrapper(content, '#00F5FF'),
    })
    console.log(`[EMAIL] Welcome sent to ${email}`)
    return true
  } catch (err) {
    console.error('[EMAIL] Welcome error:', err)
    return false
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  const resetLink = `${APP_URL}/reset-password?token=${token}`

  const content = `
    <!-- label -->
    <p style="color:#9B00FF;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">Seguridad de cuenta</p>

    <!-- heading -->
    <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 10px;letter-spacing:-0.3px;line-height:1.3;">
      Restablecer contraseña
    </h1>
    <p style="color:rgba(255,255,255,0.45);font-size:13px;margin:0 0 32px;line-height:1.8;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en
      <span style="color:rgba(255,255,255,0.7);font-weight:600;">JD INTERNACIONAL</span>.
      Si no fuiste tú, puedes ignorar este correo.
    </p>

    <!-- divider -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="height:1px;background:rgba(255,255,255,0.06);"></td></tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="border-radius:10px;background:linear-gradient(135deg,#7B00EF 0%,#00F5FF 100%);">
          <a href="${resetLink}"
             style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 30px;border-radius:10px;letter-spacing:0.5px;">
            Restablecer contraseña &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- link box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 18px;">
          <p style="color:rgba(255,255,255,0.25);font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 5px;">O copia este enlace</p>
          <p style="color:rgba(155,0,255,0.65);font-size:11px;margin:0;word-break:break-all;font-family:'Courier New',Courier,monospace;">${resetLink}</p>
        </td>
      </tr>
    </table>

    <!-- warning -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:rgba(255,180,0,0.03);border:1px solid rgba(255,180,0,0.1);border-radius:9px;padding:12px 16px;">
          <p style="color:rgba(255,180,0,0.55);font-size:11px;margin:0;line-height:1.6;">
            Este enlace expira en <strong style="color:rgba(255,180,0,0.75);">1 hora</strong>. Si no solicitaste esto, tu cuenta sigue segura.
          </p>
        </td>
      </tr>
    </table>
  `

  try {
    await transporter.sendMail({
      from: `"JD INTERNACIONAL" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Restablecer contraseña — JD INTERNACIONAL',
      html: emailWrapper(content, '#9B00FF'),
    })
    console.log(`[EMAIL] Reset sent to ${email}`)
    return true
  } catch (err) {
    console.error('[EMAIL] Reset error:', err)
    return false
  }
}
