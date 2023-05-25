import { Router } from 'express';
import controller from '../controllers/posts.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';

const router = Router();

router.get('/', controller.getInCategory);
router.post('/', authenticateJWT, controller.create);

export default router;