import { Router } from 'express';
import controller from '../controllers/posts.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';
import checkBodyFieldsCurry from '../middlewares/check.body.fields.middleware.js';
import checkUrlParamsCurry from '../middlewares/check.url.params.middleware.js';

const router = Router();

router.get('/', 
    checkUrlParamsCurry(['category_id']),
    controller.getInCategory);
router.get('/:id', controller.getPostById);
router.post('/', 
    authenticateJWT, 
    checkBodyFieldsCurry(['category_id', 'title', 'content']), 
    controller.create);

export default router;