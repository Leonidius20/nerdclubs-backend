import { Router } from "express";
import controller from "../controllers/wiki.pages.controller.js";
import authenticateJWT from "../middlewares/authenticate.middleware.js";
import checkBodyFieldsCurry from "../middlewares/check.body.fields.middleware.js";
import checkUrlParamsCurry from "../middlewares/check.url.params.middleware.js";
import checkCommunityModeratorship from "../middlewares/check.community.moderatorship.js";

const router = Router();

router.post('/', 
    authenticateJWT,
    checkBodyFieldsCurry(['url', 'title', 'community_id', 'content']),
    controller.create
);

router.get('/',
    checkUrlParamsCurry(['community_id', 'url']),
    controller.getByUrl
);

router.put('/',
    authenticateJWT,
    checkBodyFieldsCurry(['wiki_page_id', 'title', 'content']),
    controller.update
);

router.get('/all',
    checkUrlParamsCurry(['community_id']),
    controller.getAllInCommunity
);

router.delete('/',
    authenticateJWT,
    checkCommunityModeratorship,
    checkBodyFieldsCurry(['wiki_page_id']),
    controller.remove
);

export default router;