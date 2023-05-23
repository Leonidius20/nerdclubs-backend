import { Router } from 'express';
import controller from '../controllers/biometrics.login.controller.js';

const router = Router();

/**
 * @api {get} /biometrics/login Get a challenge to log in with webauthn credentials
 */
router.get('/', controller.get);

/**
 * @api {post} /biometrics/login Log in with webauthn credentials
 * */
router.post('/', controller.create);

export default router;