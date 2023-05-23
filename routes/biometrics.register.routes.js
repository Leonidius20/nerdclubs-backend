import { Router } from 'express';
import controller from '../controllers/biometrics.register.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';

const router = Router();

/**
 * @api {get} /biometrics/register Get a challenge to register webauthn credentials
 */
router.get('/', authenticateJWT, controller.get);

/**
 * @api {post} /biometrics/register Register webauthn credentials
 * @apiParam {String} username Username
 * */
router.post('/', authenticateJWT, controller.create);

export default router;