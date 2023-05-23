import { Router } from 'express';
import controller from '../controllers/user.controller.js';

const router = Router();

/**
 * @api {get} /users Get all users (only for testing) todo remove
 */
router.get('/', controller.get);

/**
 * @api {post} /users Create a new user
 */
router.post('/', controller.create);

export default router;