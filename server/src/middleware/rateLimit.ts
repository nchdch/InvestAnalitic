import rateLimit from 'express-rate-limit'

/** Общий лимит для всех /api-запросов — защита от грубого перебора/скрейпинга. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

/** Жёсткий лимит для чувствительных auth-эндпоинтов (логин, регистрация, сброс пароля). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток. Попробуйте позже.' },
})
