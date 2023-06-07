import { Router } from 'express';
import controller from '../controllers/user.controller.js';
import checkUrlParamsCurry from '../middlewares/check.url.params.middleware.js';
import checkBodyFieldsCurry from '../middlewares/check.body.fields.middleware.js';
import checkSiteAdminship from '../middlewares/check.site.adminship.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';

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

    // this has to go before :id route
router.get('/banned', 
    authenticateJWT,
    checkSiteAdminship,
    controller.getBannedUsers);

router.get('/:id', controller.getById);



router.put('/:id/ban',
    authenticateJWT,
    checkSiteAdminship,
    controller.banUser);

router.put('/:id/unban',
    authenticateJWT,
    checkSiteAdminship,
    controller.unbanUser);


export default router;