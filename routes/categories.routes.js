import { Router } from 'express';
import controller from '../controllers/categories.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';
import checkCommunityModeratorship from '../middlewares/check.community.moderatorship.js';

const router = Router();

router.get('/', controller.getAllInCommunity);
router.get('/:id', controller.getById);
router.post('/', authenticateJWT, checkCommunityModeratorship, controller.create);

export default router;