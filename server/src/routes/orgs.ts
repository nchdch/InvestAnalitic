import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import * as ctrl from '../controllers/orgController.js'

export const orgRouter = Router()

orgRouter.use(requireAuth)

orgRouter.get('/lookup', ctrl.lookupInn)
orgRouter.get('/', ctrl.listUserOrgs)
orgRouter.post('/', ctrl.createOrJoin)
orgRouter.get('/:id', ctrl.getOrg)
orgRouter.get('/:id/members', ctrl.listMembers)
orgRouter.post('/:id/invite', ctrl.invite)
orgRouter.post('/:id/members/:membershipId/approve', ctrl.approveMember)
orgRouter.post('/:id/members/:membershipId/reject', ctrl.rejectMember)
orgRouter.put('/:id/members/:membershipId/role', ctrl.updateRole)
orgRouter.post('/invite/accept', ctrl.acceptInvite)
