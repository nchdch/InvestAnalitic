import { Router } from 'express'
import * as ctrl from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post('/register', ctrl.register)
authRouter.post('/login', ctrl.login)
authRouter.post('/logout', ctrl.logout)
authRouter.post('/refresh', ctrl.refresh)
authRouter.get('/verify-email', ctrl.verifyEmail)
authRouter.post('/resend-verification', ctrl.resendVerification)
authRouter.post('/forgot-password', ctrl.forgotPassword)
authRouter.post('/reset-password', ctrl.resetPassword)
authRouter.post('/change-password', requireAuth, ctrl.changePassword)
authRouter.get('/google', ctrl.googleRedirect)
authRouter.get('/google/callback', ctrl.googleCallback)
