import nodemailer from 'nodemailer'

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const FROM = process.env.SMTP_FROM ?? 'noreply@investanalitic.ru'

function createTransport() {
  if (!process.env.SMTP_HOST) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

const transport = createTransport()

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transport) {
    console.log(`\n[EMAIL] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, '')}\n`)
    return
  }
  await transport.sendMail({ from: FROM, to, subject, html })
}

const btn = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${label}</a>`

export const emailService = {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${FRONTEND_URL}/auth/verify?token=${token}`
    await send(email, 'Подтвердите email — InvestAnalitic', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Добро пожаловать в InvestAnalitic!</h2>
        <p>Нажмите кнопку ниже, чтобы подтвердить адрес электронной почты:</p>
        <p>${btn(url, 'Подтвердить email')}</p>
        <p style="color:#6b7280;font-size:14px">Ссылка действительна 24 часа. Если вы не регистрировались — проигнорируйте письмо.</p>
      </div>`)
  },

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${FRONTEND_URL}/auth/reset-password?token=${token}`
    await send(email, 'Сброс пароля — InvestAnalitic', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Сброс пароля</h2>
        <p>Нажмите кнопку ниже, чтобы установить новый пароль:</p>
        <p>${btn(url, 'Сбросить пароль')}</p>
        <p style="color:#6b7280;font-size:14px">Ссылка действительна 2 часа. Если вы не запрашивали сброс — проигнорируйте письмо.</p>
      </div>`)
  },

  async sendOrgJoinRequestEmail(adminEmail: string, requesterName: string, orgName: string): Promise<void> {
    const url = `${FRONTEND_URL}/app/org/requests`
    await send(adminEmail, `Заявка на вступление в ${orgName} — InvestAnalitic`, `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>${requesterName} хочет вступить в ${orgName}</h2>
        <p>Зайдите в управление организацией, чтобы одобрить или отклонить заявку.</p>
        <p>${btn(url, 'Рассмотреть заявку')}</p>
      </div>`)
  },

  async sendOrgInviteEmail(email: string, inviterName: string, orgName: string, token: string): Promise<void> {
    const url = `${FRONTEND_URL}/org/invite?token=${token}`
    await send(email, `Приглашение в ${orgName} — InvestAnalitic`, `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>${inviterName} приглашает вас в ${orgName}</h2>
        <p>Примите приглашение, чтобы получить доступ к инвестиционному портфелю организации.</p>
        <p>${btn(url, 'Принять приглашение')}</p>
        <p style="color:#6b7280;font-size:14px">Ссылка действительна 7 дней.</p>
      </div>`)
  },
}
