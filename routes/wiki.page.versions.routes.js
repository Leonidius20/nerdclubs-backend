import { Router } from "express";
import controller from "../controllers/wiki.page.versions.controller.js";
import checkUrlParamsCurry from "../middlewares/check.url.params.middleware.js";
import authenticateJWT from "../middlewares/authenticate.middleware.js";
import checkBodyFieldsCurry from "../middlewares/check.body.fields.middleware.js";
import checkCommunityModeratorship from "../middlewares/check.community.moderatorship.js";

const router = Router();

router.get('/',
    checkUrlParamsCurry(['wiki_page_id']),
    controller.getAllVersionsOfPage
);

router.get('/:wiki_page_version_id',
    controller.getVersionById
);

router.put('/rollback',
    authenticateJWT,
    checkBodyFieldsCurry(['wiki_page_version_id', 'community_id']),
    checkCommunityModeratorship,
    controller.rollbackTo
);

export default router;