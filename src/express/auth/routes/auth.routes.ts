import { Router } from 'express';
import {
  getProfile,
  login,
  logout,
  recoverPassword,
  register,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/recover-password', recoverPassword);

router.get('/profile', authMiddleware, getProfile);
router.post('/logout', authMiddleware, logout);

router.get(
  '/admin/users',
  authMiddleware,
  requireRole(['ADMIN']),
  (_req, res) => {
    res.json({ success: true, message: 'Acceso a gestión de usuarios' });
  },
);

export default router;
