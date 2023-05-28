import { Router } from 'express';
import controller from '../controllers/user.controller.js';
import checkUrlParamsCurry from '../middlewares/check.url.params.middleware.js';
import checkBodyFieldsCurry from '../middlewares/check.body.fields.middleware.js';

const router = Router();

/**
 * @api {get} /users Get user by username
 */
router.get('/', checkUrlParamsCurry(['username']), controller.get);

/**
 * @api {post} /users Create a new user
 */
router.post('/', 
    checkBodyFieldsCurry(['username', 'password', 'email']),
    controller.create);

router.get('/:id', controller.getById);

export default router;