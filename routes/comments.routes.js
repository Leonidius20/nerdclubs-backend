import { Router } from 'express';
import commentsController from '../controllers/comments.controller.js';
import authenticateJWT, { authenticateJWTOptional } from '../middlewares/authenticate.middleware.js';

const router = Router();

router.get('/:post_id', authenticateJWTOptional, commentsController.getAllForPost);
router.post('/', authenticateJWT, commentsController.create);

export default router;
