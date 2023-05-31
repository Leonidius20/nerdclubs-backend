import { Router } from 'express';
import controller from '../controllers/posts.controller.js';
import authenticateJWT, { authenticateJWTOptional } from '../middlewares/authenticate.middleware.js';
import checkBodyFieldsCurry from '../middlewares/check.body.fields.middleware.js';
import checkUrlParamsCurry from '../middlewares/check.url.params.middleware.js';
import checkCommunityModeratorship from '../middlewares/check.community.moderatorship.js';

const router = Router();

router.get('/', 
    checkUrlParamsCurry(['category_id']),
    controller.getInCategory);

router.get('/:id', 
    authenticateJWTOptional,
    controller.getPostById);

router.post('/', 
    authenticateJWT, 
    checkBodyFieldsCurry(['category_id', 'title', 'content']), 
    controller.create);

router.delete('/:id',
    authenticateJWT,
    // moderatorship is checked in the controller, bc we 
    // don't get community_id in the request body
    controller.remove);

export default router;