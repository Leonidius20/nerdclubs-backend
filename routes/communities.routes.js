import { Router } from 'express';
import controller from '../controllers/communities.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';

const router = Router();

/**
 * paged search. If no page is specified, it will return the first page
 * If no seach query is specified, it will return all communities
 */
router.get('/', controller.getAll);
router.get('/:url', controller.getByUrl);
router.post('/', authenticateJWT, controller.create);

export default router;