import { Router } from 'express';
import controller from '../controllers/communities.controller.js';
import authenticateJWT, { authenticateJWTOptional } from '../middlewares/authenticate.middleware.js';
import moderatorsRouter from './moderators.routes.js';
import extractCommunityUrl from '../middlewares/extract.community.url.js';

const router = Router();

/**
 * paged search. If no page is specified, it will return the first page
 * If no seach query is specified, it will return all communities
 */
router.get('/', controller.getAll);

router.get('/:url', authenticateJWTOptional, controller.getByUrl);
router.post('/', authenticateJWT, controller.create);

// add sub-route for moderators of a community


// router.use('/:url/moderators', extractCommunityUrl, moderatorsRouter);

// maybe add sub-route for categories of a community

export default router;