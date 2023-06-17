import { Router } from 'express';
import controller from '../controllers/categories.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';
import checkCommunityModeratorship from '../middlewares/check.community.moderatorship.js';
import checkUrlParamsCurry from '../middlewares/check.url.params.middleware.js';
import checkBodyFieldsCurry from '../middlewares/check.body.fields.middleware.js';

const router = Router();

router.get('/', 
    checkUrlParamsCurry(['community_id']),
    controller.getAllInCommunity
);

router.get('/:id', controller.getById);

router.post('/', 
    authenticateJWT, 
    checkCommunityModeratorship, 
    checkBodyFieldsCurry(['name', 'community_id']),
    controller.create
);

router.delete('/',
    authenticateJWT,
    checkCommunityModeratorship,
    checkBodyFieldsCurry(['category_id']),
    controller.remove
);

export default router;