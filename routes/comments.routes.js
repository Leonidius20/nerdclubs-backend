import { Router } from 'express';
import commentsController from '../controllers/comments.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';

const router = Router();

router.get('/:post_id', commentsController.getAllForPost);
router.post('/', authenticateJWT, commentsController.create);

export default router;
