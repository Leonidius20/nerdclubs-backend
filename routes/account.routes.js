import { Router } from 'express';
import controller from '../controllers/account.controller.js';
import validateJWT from '../middlewares/authenticate.middleware.js';

const router = Router();

router.get('/', validateJWT, controller.getUserDataFromToken);

export default router;