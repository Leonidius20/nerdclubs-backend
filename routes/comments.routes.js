import { Router } from 'express';
import commentsController from '../controllers/comments.controller.js';
import authenticateJWT, { authenticateJWTOptional } from '../middlewares/authenticate.middleware.js';
import checkBodyFieldsCurry from '../middlewares/check.body.fields.middleware.js';

const router = Router();

router.get('/:post_id', authenticateJWTOptional, commentsController.getAllForPost);
router.post('/', 
    authenticateJWT, 
    checkBodyFieldsCurry(['post_id', 'content']), 
    commentsController.create
);

export default router;
