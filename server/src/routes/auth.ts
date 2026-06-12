import { Router } from 'express'
import * as ctrl from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'

export const authRouter = Router()

authRouter.post('/register', authLimiter, ctrl.register)
authRouter.post('/login', authLimiter, ctrl.login)
authRouter.post('/logout', ctrl.logout)
authRouter.post('/refresh', ctrl.refresh)
authRouter.get('/verify-email', ctrl.verifyEmail)
authRouter.post('/resend-verification', authLimiter, ctrl.resendVerification)
authRouter.post('/forgot-password', authLimiter, ctrl.forgotPassword)
authRouter.post('/reset-password', authLimiter, ctrl.resetPassword)
authRouter.post('/change-password', requireAuth, ctrl.changePassword)
authRouter.get('/google', ctrl.googleRedirect)
authRouter.get('/google/callback', ctrl.googleCallback)
