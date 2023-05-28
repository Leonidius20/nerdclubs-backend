import { Router } from 'express';
import controller from '../controllers/user.controller.js';

const router = Router();

/**
 * @api {get} /users Get user by username
 */
router.get('/', controller.get);

/**
 * @api {post} /users Create a new user
 */
router.post('/', controller.create);

router.get('/:id', controller.getById);

export default router;