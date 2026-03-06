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
<body style="margin:0;padding:0;background-color:#060710;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060710;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:36px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#00F5FF,#9B00FF);border-radius:12px;padding:9px 15px;">
                  <span style="color:#000000;font-size:17px;font-weight:900;letter-spacing:2px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">JD</span>
                </td>
                <td style="padding-left:11px;vertical-align:middle;">
                  <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:3px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">INTERNACIONAL</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:linear-gradient(160deg,rgba(0,245,255,0.04) 0%,rgba(155,0,255,0.03) 100%);border:1px solid rgba(0,245,255,0.14);border-radius:20px;padding:0;overflow:hidden;">

            <!-- top accent line -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="height:2px;background:linear-gradient(90deg,transparent,${accentColor},transparent);"></td>
              </tr>
            </table>

            <!-- content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:40px 36px;">
                  ${content}
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding-top:28px;">
            <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;letter-spacing:1px;">
              JD INTERNACIONAL &copy; 2026
            </p>
            <p style="color:rgba(255,255,255,0.12);font-size:11px;margin:6px 0 0;line-height:1.5;">
              Recibiste este correo porque tienes una cuenta en JD INTERNACIONAL.
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
    <!-- Greeting -->
    <p style="color:rgba(255,255,255,0.45);font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">Bienvenido a la plataforma</p>
    <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;line-height:1.2;">
      Hola, ${fullName} 👋
    </h1>
    <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 36px;line-height:1.7;">
      Tu cuenta ha sido creada exitosamente. Ya formas parte de la red <strong style="color:#00F5FF;">JD INTERNACIONAL</strong>. Estás listo para comenzar a construir tu negocio digital.
    </p>

    <!-- Referral code box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:rgba(0,245,255,0.05);border:1px solid rgba(0,245,255,0.18);border-radius:14px;padding:22px 24px;">
          <p style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px;">Tu Código de Referido</p>
          <p style="color:#00F5FF;font-size:32px;font-weight:900;letter-spacing:8px;margin:0;font-family:'Courier New',Courier,monospace;">${referralCode}</p>
        </td>
      </tr>
    </table>

    <!-- Invite link box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
      <tr>
        <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 20px;">
          <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Tu enlace de invitación</p>
          <p style="color:rgba(0,255,136,0.85);font-size:12px;margin:0;word-break:break-all;font-family:'Courier New',Courier,monospace;">${inviteLink}</p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#00F5FF,#00FF88);">
          <a href="${APP_URL}/dashboard"
             style="display:inline-block;color:#000000;text-decoration:none;font-weight:800;font-size:14px;padding:14px 36px;border-radius:12px;letter-spacing:1px;">
            Acceder a mi Panel →
          </a>
        </td>
      </tr>
    </table>
  `

  try {
    await transporter.sendMail({
      from: `"JD INTERNACIONAL" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `¡Bienvenido a JD INTERNACIONAL, ${fullName}!`,
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
    <!-- Icon -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:52px;height:52px;background:rgba(155,0,255,0.08);border:1px solid rgba(155,0,255,0.25);border-radius:14px;text-align:center;vertical-align:middle;">
          <span style="font-size:24px;line-height:52px;">🔐</span>
        </td>
      </tr>
    </table>

    <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Seguridad de cuenta</p>
    <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;line-height:1.2;">
      Restablecer contraseña
    </h1>
    <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 36px;line-height:1.7;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color:#9B00FF;">JD INTERNACIONAL</strong>. Si no fuiste tú, puedes ignorar este correo con seguridad.
    </p>

    <!-- CTA Button -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#9B00FF,#00F5FF);">
          <a href="${resetLink}"
             style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 36px;border-radius:12px;letter-spacing:1px;">
            Restablecer Contraseña →
          </a>
        </td>
      </tr>
    </table>

    <!-- Link box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 20px;">
          <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">O copia este enlace en tu navegador</p>
          <p style="color:rgba(155,0,255,0.8);font-size:12px;margin:0;word-break:break-all;font-family:'Courier New',Courier,monospace;">${resetLink}</p>
        </td>
      </tr>
    </table>

    <!-- Warning -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:rgba(255,200,0,0.04);border:1px solid rgba(255,200,0,0.12);border-radius:10px;padding:14px 18px;">
          <p style="color:rgba(255,200,0,0.7);font-size:12px;margin:0;line-height:1.6;">
            ⚠️ Este enlace expira en <strong style="color:rgba(255,200,0,0.9);">1 hora</strong>. Si no solicitaste esto, tu cuenta sigue segura.
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
